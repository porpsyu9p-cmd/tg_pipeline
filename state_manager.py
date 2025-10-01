# state_manager.py
# Этот модуль хранит глобальное состояние прогресса выполнения задачи.

STATE = {
    "processed": 0,
    "total": 0,
    "is_running": False,
    "finished": False, # Новое состояние для отслеживания завершения
}

def reset_state():
    """Сбрасывает состояние в начальное."""
    STATE["processed"] = 0
    STATE["total"] = 0
    STATE["is_running"] = False
    STATE["finished"] = False

def set_running(running: bool):
    """Устанавливает флаг, что процесс запущен или остановлен."""
    STATE["is_running"] = running
    if running:
        STATE["finished"] = False # Сбрасываем флаг завершения при старте

def set_finished(finished: bool):
    """Устанавливает флаг, что процесс завершен."""
    STATE["finished"] = finished

def increment_processed():
    """Увеличивает счетчик обработанных постов."""
    if STATE["is_running"]:
        STATE["processed"] += 1

def set_total(total: int):
    """Устанавливает общее количество постов для обработки."""
    if STATE["is_running"]:
        STATE["total"] = total

def get_state():
    """Возвращает текущее состояние."""
    return STATE
