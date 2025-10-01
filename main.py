# main.py — ТЕКСТ + МЕДИА одним постом (альбомом), бережная склейка соседних сообщений
import os, asyncio, yaml, pathlib, json, shutil, subprocess
from dotenv import load_dotenv
from telethon import TelegramClient
from PIL import Image
from state_manager import increment_processed, set_total

# === 0. Ключи и конфиг ===
load_dotenv()
TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID"))
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")

with open("config.yaml","r",encoding="utf-8") as f:
    CFG = yaml.safe_load(f)

TARGET = CFG.get("destination_channel", "me")
OUT = pathlib.Path.home() / "Library" / "Caches" / "tg_pipeline"   # кэш, чтобы не засорять проект
OUT.mkdir(exist_ok=True, parents=True)

STATE_PATH = pathlib.Path("state.json")
STATE = json.loads(STATE_PATH.read_text()) if STATE_PATH.exists() else {}

# === 1. Помощники для медиа ===
def ffmpeg_exists() -> bool:
    return shutil.which("ffmpeg") is not None

def add_logo_image(img_path: str, logo_path: str, pos: str="bottom-right", margin: int=24) -> str:
    """Кладём логотип (если есть) и сохраняем в OUT. Возвращаем путь."""
    try:
        src = pathlib.Path(img_path)
        out = OUT / (src.stem + "_branded.png")
        if not pathlib.Path(logo_path).exists():
            Image.open(img_path).save(out); return str(out)
        img = Image.open(img_path).convert("RGBA")
        logo = Image.open(logo_path).convert("RGBA")
        scale = img.width * 0.15 / max(1, logo.width)
        logo = logo.resize((int(logo.width*scale), int(logo.height*scale)))
        x = margin if "left" in pos else img.width - logo.width - margin
        y = margin if "top" in pos else img.height - logo.height - margin
        img.alpha_composite(logo, dest=(x, y))
        img.save(out); return str(out)
    except Exception as e:
        print("Image branding error:", e)
        dst = OUT / pathlib.Path(img_path).name
        shutil.copy(img_path, dst); return str(dst)

def brand_video(video_path: str, logo_path: str) -> str:
    """Логотип на видео через ffmpeg (если есть), иначе просто переложим в OUT."""
    src = pathlib.Path(video_path)
    out = OUT / (src.stem + "_branded.mp4")
    if not ffmpeg_exists() or not pathlib.Path(logo_path).exists():
        dst = OUT / src.name
        if src.resolve() != dst.resolve(): shutil.move(str(src), str(dst))
        return str(dst)
    try:
        cmd = ["ffmpeg","-y","-i", str(video_path), "-i", logo_path,
               "-filter_complex","overlay=W-w-24:H-h-24","-codec:a","copy", str(out)]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return str(out)
    except Exception as e:
        print("Video branding error:", e)
        dst = OUT / src.name
        if src.resolve() != dst.resolve(): shutil.move(str(src), str(dst))
        return str(dst)

async def download_and_brand(client, message):
    """Скачать медиа из сообщения и вернуть список путей к обработанным файлам."""
    paths = []
    if not message.media:
        return paths
    try:
        raw = await client.download_media(message)
        if raw:
            low = raw.lower()
            if low.endswith((".jpg",".jpeg",".png",".webp",".bmp",".tiff")):
                paths.append(add_logo_image(raw, CFG["logo"]["path"],
                                            CFG["logo"]["position"], CFG["logo"]["margin"]))
                try: os.remove(raw)
                except: pass
            elif low.endswith((".mp4",".mov",".mkv",".webm",".m4v")):
                paths.append(brand_video(raw, CFG["logo"]["path"]))
            else:
                dst = OUT / pathlib.Path(raw).name
                shutil.move(raw, dst); paths.append(str(dst))
    except Exception as e:
        print("Media download error:", e)
    return paths

# === 2. Основная логика ===
async def process_channel(client: TelegramClient, ch: str, limit: int):
    print(f"== Channel: {ch}")
    entity = await client.get_entity(ch)
    last_id = STATE.get(ch, 0)

    # Используем лимит из веб-интерфейса
    msgs = [m async for m in client.iter_messages(entity, limit=limit)]
    set_total(len(msgs)) # Устанавливаем общее количество для этого канала
    msgs.reverse()  # от старых к новым

    i = 0
    while i < len(msgs):
        # На каждой итерации даём возможность циклу событий обработать отмену
        await asyncio.sleep(0)

        m = msgs[i]
        if m.id <= last_id:
            i += 1
            increment_processed() # Увеличиваем счетчик, даже если пропускаем
            continue

        text = (m.message or "").strip()
        media_paths = await download_and_brand(client, m)

        # --- БЕРЕЖНАЯ СКЛЕЙКА (читаем настройки из config.yaml) ---
        MERGE_WINDOW_SEC = int(CFG.get("merge", {}).get("window_sec", 600))   # 10 мин по умолчанию
        MERGE_LOOKAHEAD  = int(CFG.get("merge", {}).get("lookahead", 2))
        ONLY_IF_ONE_NO_TEXT = bool(CFG.get("merge", {}).get("only_if_one_has_no_text", True))

        def has_text(s: str) -> bool:
            return bool(s and s.strip())

        def has_media(paths: list) -> bool:
            return bool(paths)

        # Склеиваем, если ровно одному чего-то не хватает (или по ослабленному правилу)
        cond_start = (has_text(text) ^ has_media(media_paths)) or \
                     (not ONLY_IF_ONE_NO_TEXT and (has_text(text) or has_media(media_paths)))

        if cond_start:
            j = 1
            while j <= MERGE_LOOKAHEAD and (i + j) < len(msgs):
                n = msgs[i + j]
                if n.id <= last_id:
                    j += 1; continue
                # далеко по времени — выходим
                if abs((m.date - n.date).total_seconds()) > MERGE_WINDOW_SEC:
                    break
                # не склеиваем альбомы
                if getattr(n, "grouped_id", None):
                    break

                more_text = (n.message or "").strip()
                more_media = await download_and_brand(client, n)

                merge_ok = False
                if ONLY_IF_ONE_NO_TEXT:
                    if (has_text(text) and not has_text(more_text) and has_media(more_media)) \
                       or (has_media(media_paths) and not has_text(text) and has_text(more_text)):
                        merge_ok = True
                else:
                    if (has_text(text) and has_media(more_media)) or \
                       (has_media(media_paths) and has_text(more_text)):
                        merge_ok = True

                if merge_ok:
                    if has_text(more_text):
                        text = (text + ("\n\n" + more_text)).strip()
                    if has_media(more_media):
                        media_paths += more_media
                    STATE[ch] = n.id
                    i += 1          # «съели» соседнее
                else:
                    j += 1

        # --- Формируем подпись и отправляем одним постом ---
        # Чтоб не было большой карточки-превью, «ломаем» ссылку точкой в квадратных скобках
        caption = (text or "").strip()

        try:
            if media_paths:
                if len(media_paths) > 1:
                    try:
                        await client.send_file(TARGET, media_paths, caption=caption, album=True)
                    except Exception as e:
                        print("Album send error:", e)
                        await client.send_file(TARGET, media_paths[0], caption=caption)
                        for p in media_paths[1:]:
                            await client.send_file(TARGET, p)
                else:
                    await client.send_file(TARGET, media_paths[0], caption=caption)
            else:
                await client.send_message(TARGET, caption or "(media only)", link_preview=False)
        finally:
            # чистим кэш
            for p in media_paths:
                try: pathlib.Path(p).unlink(missing_ok=True)
                except Exception as e: print("Cleanup error:", e)

        STATE[ch] = max(STATE.get(ch, 0), m.id)
        STATE_PATH.write_text(json.dumps(STATE))
        increment_processed() # Увеличиваем счетчик после успешной обработки
        i += 1

async def main(limit: int = 100):
    """Основная функция, теперь принимает лимит постов."""
    client = TelegramClient("session", TELEGRAM_API_ID, TELEGRAM_API_HASH)
    try:
        await client.start()
        for ch in CFG["channels"]:
            # Передаем лимит в обработчик канала
            await process_channel(client, ch, limit=limit)
    except asyncio.CancelledError:
        print("Main task was cancelled. Disconnecting...")
        # Это исключение возникнет при нажатии "Остановить"
    finally:
        if client.is_connected():
            await client.disconnect()
        print("Done.")

if __name__ == "__main__":
    # Теперь при прямом запуске можно указать лимит
    asyncio.run(main(limit=100))
