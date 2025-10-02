# main.py — ТЕКСТ + МЕДИА одним постом (альбомом), бережная склейка соседних сообщений
import os, asyncio, yaml, pathlib, json, shutil, subprocess
from datetime import datetime, timedelta
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors import (
    ChatAdminRequiredError,
    ChatWriteForbiddenError,
    ChannelPrivateError,
    FloodWaitError,
    UserBannedInChannelError,
)
from PIL import Image
from state_manager import increment_processed, set_total

# === 0. Ключи и конфиг ===
load_dotenv()
TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID"))
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")

with open("config.yaml","r",encoding="utf-8") as f:
    CFG = yaml.safe_load(f)

# Определяем целевой чат/канал из секции delivery
DELIVERY = CFG.get("delivery", {}) or {}
TARGET = (
    DELIVERY.get("destination_channel")
    or CFG.get("destination_channel")
)
if not TARGET:
    raise RuntimeError("destination_channel is not configured in config.yaml under delivery.destination_channel")
print(f"Delivery target channel: {TARGET}")

DEBUG_CFG = CFG.get("debug", {}) or {}
MIRROR_TO_ME = bool(DEBUG_CFG.get("mirror_to_me", False))
TEXT_ONLY = bool(DELIVERY.get("text_only", False))
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

# === 2a. Выбор топ-постов за период по метрикам ===
async def process_top_posts(client: TelegramClient, ch: str, period_days: float, top_counts: dict, desired_total: int | None = None):
    print(f"== Top posts mode: channel {ch}, period_days={period_days}, counts={top_counts}")
    entity = await client.get_entity(ch)
    # Поддерживаем дробные дни (например, 0.5 дня = 12 часов)
    days_span = max(0.001, float(period_days))
    since_dt = datetime.utcnow() - timedelta(days=days_span)

    # Собираем сообщения за период
    collected = []
    async for m in client.iter_messages(entity, limit=2000):
        if m.date.tzinfo:
            msg_dt = m.date.replace(tzinfo=None)
        else:
            msg_dt = m.date
        if msg_dt < since_dt:
            break

        # Пропускаем видео/GIF
        media = getattr(m, "media", None)
        doc = getattr(media, "document", None) if media else None
        mime = (getattr(doc, "mime_type", "") or "").lower() if doc else ""
        attrs = getattr(doc, "attributes", []) or []
        is_animated = any(getattr(a, "animated", False) or a.__class__.__name__ == "DocumentAttributeAnimated" for a in attrs)
        if (mime.startswith("video") or mime == "image/gif" or is_animated):
            continue

        # Считываем реакции и просмотры (если доступны)
        likes = 0
        comments = int(getattr(m, 'replies', None).replies if getattr(m, 'replies', None) else 0)
        views = int(getattr(m, 'views', 0) or 0)

        try:
            r = getattr(m, 'reactions', None)
            if r and getattr(r, 'results', None):
                for res in r.results:
                    emoji = getattr(res, 'reaction', None)
                    count = int(getattr(res, 'count', 0) or 0)
                    # Считаем любые реакции как лайки, либо фильтровать по \u2764\ufe0f
                    likes += count
        except Exception:
            pass

        collected.append({
            'message': m,
            'likes': likes,
            'comments': comments,
            'views': views,
        })

    print(f"Collected {len(collected)} messages in period for {ch}")

    # Сортировки и выбор топов с гарантией квот и без дублей
    def sorted_by(key: str):
        sorted_all = sorted(collected, key=lambda x: x.get(key, 0), reverse=True)
        positives = [x for x in sorted_all if x.get(key, 0) > 0]
        return positives if positives else sorted_all

    unique_ids = set()
    unique_msgs = []

    for key in ['likes', 'comments', 'views']:
        quota = int(top_counts.get(key, 0) or 0)
        if quota <= 0:
            continue
        count_added = 0
        for item in sorted_by(key):
            if count_added >= quota:
                break
            mid = item['message'].id
            if mid in unique_ids:
                continue
            unique_ids.add(mid)
            unique_msgs.append(item['message'])
            count_added += 1

    print(f"Selected unique messages after quotas: {len(unique_msgs)}")

    # При наличии явного лимита с фронта — ограничим выдачу
    if isinstance(desired_total, int) and desired_total > 0:
        unique_msgs = unique_msgs[:desired_total]

    # Фолбэк: если ничего не набрали по метрикам, добираем просто свежие текстовые посты
    if not unique_msgs:
        print("Top selection produced 0 messages, applying fallback by date...")
        # collected уже без видео/GIF; сортируем по дате у исходных сообщений
        collected_sorted = sorted(collected, key=lambda x: x['message'].date, reverse=True)
        for item in collected_sorted:
            unique_msgs.append(item['message'])
            if isinstance(desired_total, int) and desired_total > 0 and len(unique_msgs) >= desired_total:
                break

    # Второй фолбэк: если и после добора по периоду пусто, берём последние текстовые посты без ограничения периода
    if not unique_msgs:
        print("Fallback by date yielded 0 messages, expanding search window (ignore period)...")
        expanded = []
        async for m2 in client.iter_messages(entity, limit=500):
            media = getattr(m2, "media", None)
            doc = getattr(media, "document", None) if media else None
            mime = (getattr(doc, "mime_type", "") or "").lower() if doc else ""
            attrs = getattr(doc, "attributes", []) or []
            is_animated = any(getattr(a, "animated", False) or a.__class__.__name__ == "DocumentAttributeAnimated" for a in attrs)
            if (mime.startswith("video") or mime == "image/gif" or is_animated):
                continue
            expanded.append(m2)
            if isinstance(desired_total, int) and desired_total > 0 and len(expanded) >= desired_total:
                break
        unique_msgs = expanded
    print(f"Final messages to send: {len(unique_msgs)}")

    # Проставим total для прогресса
    set_total(len(unique_msgs))

    # Отправляем в целевой канал, соблюдая текущие правила склейки/медиа
    # Здесь без склейки; отправляем как есть
    for m in unique_msgs:
        caption = (m.message or "").strip()
        media_paths = await download_and_brand(client, m)
        try:
            print(f"Sending message id={m.id} to {TARGET} with media_count={len(media_paths)}")
            if media_paths and not TEXT_ONLY:
                if len(media_paths) > 1:
                    try:
                        await client.send_file(TARGET, media_paths, caption=caption, album=True)
                    except Exception as e:
                        print("Album send error:", e)
                        await client.send_file(TARGET, media_paths[0], caption=caption)
                        for p in media_paths[1:]:
                            await client.send_file(TARGET, p)
            else:
                await client.send_message(TARGET, caption or "(media only)", link_preview=False)
            print(f"Sent message id={m.id}")
            # Диагностическое зеркалирование в Saved Messages
            if MIRROR_TO_ME:
                try:
                    if media_paths and not TEXT_ONLY:
                        await client.send_file("me", media_paths[0], caption=f"[mirror] {caption}")
                    else:
                        await client.send_message("me", f"[mirror] {caption}")
                except Exception as e:
                    print("Mirror to me failed:", e)
        except (ChatAdminRequiredError, ChatWriteForbiddenError, ChannelPrivateError, UserBannedInChannelError) as e:
            print(f"Send failed due to permissions: {e.__class__.__name__}: {e}")
            print("Hint: добавьте аккаунт (из session.session) в администраторы канала и дайте право 'Публикация сообщений'.")
            if MIRROR_TO_ME:
                try:
                    await client.send_message("me", f"[mirror-note] Send to {TARGET} failed: {e.__class__.__name__}: {e}")
                except Exception:
                    pass
        except FloodWaitError as e:
            print(f"Send failed due to flood wait: wait {e.seconds} seconds")
        except Exception as e:
            print(f"Unexpected send error: {e.__class__.__name__}: {e}")
        finally:
            for p in media_paths:
                try: pathlib.Path(p).unlink(missing_ok=True)
                except Exception as e: print("Cleanup error:", e)

        increment_processed()

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
        # Пропускаем посты с видео или GIF (анимации)
        try:
            media = getattr(m, "media", None)
            doc = getattr(media, "document", None) if media else None
            mime = (getattr(doc, "mime_type", "") or "").lower() if doc else ""
            attrs = getattr(doc, "attributes", []) or []
            is_animated = any(getattr(a, "animated", False) or a.__class__.__name__ == "DocumentAttributeAnimated" for a in attrs)
            if (mime.startswith("video") or mime == "image/gif" or is_animated):
                i += 1
                increment_processed()
                continue
        except Exception:
            # В случае ошибки определения типа медиа не падаем — продолжаем обычную обработку
            pass

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

async def main(limit: int = 100, period_hours: int | None = None):
    """Основная функция, теперь принимает лимит постов."""
    client = TelegramClient("session", TELEGRAM_API_ID, TELEGRAM_API_HASH)
    try:
        await client.start()
        # Диагностика цели доставки
        try:
            me = await client.get_me()
            tgt = await client.get_entity(TARGET)
            cls = tgt.__class__.__name__
            title = getattr(tgt, 'title', None) or getattr(tgt, 'username', None) or str(TARGET)
            is_broadcast = bool(getattr(tgt, 'broadcast', False))
            is_megagroup = bool(getattr(tgt, 'megagroup', False))
            print(f"Will send as {me.username or me.first_name} to '{title}' ({cls}), broadcast={is_broadcast}, megagroup={is_megagroup}")
        except Exception as e:
            print("Target entity diagnostics failed:", e)
        top_cfg = (CFG.get("top_posts") or {})
        enabled_top = bool(top_cfg.get("enabled", False))
        if enabled_top:
            # Период из запроса в часах имеет приоритет над конфигом в днях
            period_days = int(top_cfg.get("period_days", 7))
            if period_hours is not None:
                # переводим часы в дни с плавающей точкой
                period_days = max(0.0417, float(period_hours) / 24.0)
            counts = top_cfg.get("top_by") or {"likes": 2, "comments": 2, "views": 2}
            for ch in CFG["channels"]:
                await process_top_posts(client, ch, period_days=period_days, top_counts=counts, desired_total=limit)
        else:
            for ch in CFG["channels"]:
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
