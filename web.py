from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn
import asyncio

# Импортируем вашу основную функцию и управление состоянием
from main import main as run_pipeline_main
from state_manager import get_state, set_running, reset_state, set_finished

app = FastAPI()

# Глобальная переменная для отслеживания задачи
current_task: asyncio.Task = None

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Отдает HTML страницу с кнопками управления и статусом."""
    return """
    <html>
        <head>
            <title>TG Pipeline Runner</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f0f0; }
                .container { text-align: center; }
                button { font-size: 20px; padding: 10px 20px; cursor: pointer; margin: 5px; }
                #postLimit { font-size: 20px; padding: 10px; width: 100px; text-align: center; }
                #status { margin-top: 20px; font-size: 18px; color: #555; min-height: 50px; }
                progress { width: 300px; height: 25px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Telegram Pipeline</h1>
                <div>
                    <label for="postLimit">Количество постов:</label>
                    <input type="number" id="postLimit" value="100" min="1">
                </div>
                <br>
                <button onclick="runPipeline()">Запустить</button>
                <button onclick="stopPipeline()">Остановить</button>
                <div id="status">
                    <p id="status-text">Готов к запуску.</p>
                    <progress id="progress-bar" value="0" max="100"></progress>
                </div>
            </div>
            <script>
                const statusText = document.getElementById('status-text');
                const progressBar = document.getElementById('progress-bar');

                async function runPipeline() {
                    const limit = document.getElementById('postLimit').value;
                    statusText.innerText = 'Запускаем...';
                    try {
                        const response = await fetch('/run-pipeline', { 
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ limit: parseInt(limit) })
                        });
                        const data = await response.json();
                        statusText.innerText = data.message;
                    } catch (error) {
                        statusText.innerText = 'Сетевая ошибка: ' + error;
                    }
                }

                async function stopPipeline() {
                    statusText.innerText = 'Останавливаем...';
                    try {
                        const response = await fetch('/stop-pipeline', { method: 'POST' });
                        const data = await response.json();
                        statusText.innerText = data.message;
                    } catch (error) {
                        statusText.innerText = 'Сетевая ошибка: ' + error;
                    }
                }

                // Опрашиваем статус каждые 1.5 секунды
                setInterval(async () => {
                    try {
                        const response = await fetch('/status');
                        const state = await response.json();
                        if (state.is_running) {
                            progressBar.max = state.total;
                            progressBar.value = state.processed;
                            statusText.innerText = `В процессе... Обработано ${state.processed} из ${state.total}`;
                        } else if (state.finished) {
                            progressBar.max = state.total;
                            progressBar.value = state.processed;
                            statusText.innerText = `Завершено. Обработано ${state.processed} из ${state.total}.`;
                        }
                    } catch (error) {
                        // Ничего не делаем при ошибке опроса
                    }
                }, 1500);
            </script>
        </body>
    </html>
    """

@app.get("/status")
async def status_endpoint():
    """Возвращает текущее состояние прогресса."""
    return get_state()

async def run_pipeline_task(limit: int):
    """Обёртка для запуска задачи и управления состоянием."""
    global current_task
    set_running(True)
    try:
        print(f"Starting pipeline with limit: {limit}")
        await run_pipeline_main(limit=limit)
        print("Pipeline finished successfully.")
    except asyncio.CancelledError:
        print("Pipeline task was cancelled.")
    except Exception as e:
        print(f"An error occurred in pipeline: {e}")
    finally:
        set_running(False)
        set_finished(True) # Устанавливаем флаг завершения
        current_task = None

@app.post("/run-pipeline")
async def trigger_pipeline(request: Request):
    """Запускает основную логику в фоновом режиме."""
    global current_task
    if current_task and not current_task.done():
        return JSONResponse(status_code=409, content={"message": "Процесс уже запущен."})
    
    data = await request.json()
    limit = data.get("limit", 100)

    # Сбрасываем состояние перед новым запуском
    reset_state()
    
    task = asyncio.create_task(run_pipeline_task(limit=limit))
    current_task = task
    
    return {"message": f"Процесс парсинга запущен. Лимит: {limit} постов."}

@app.post("/stop-pipeline")
async def stop_pipeline_endpoint():
    """Отменяет запущенную задачу."""
    global current_task
    if not current_task or current_task.done():
        return JSONResponse(status_code=404, content={"message": "Нет активных процессов для остановки."})

    current_task.cancel()
    return {"message": "Команда на остановку отправлена. Процесс завершится в ближайшее время."}

if __name__ == "__main__":
    print("Запустите сервер командой: uvicorn web:app --reload")