import os
from openai import OpenAI
from dotenv import load_dotenv

# Загружаем переменные окружения, включая OPENAI_API_KEY
load_dotenv()

# Инициализируем клиент OpenAI
# Ключ будет автоматически подхвачен из переменной окружения OPENAI_API_KEY
client = OpenAI()

DEFAULT_PROMPT_TEMPLATE = (
    "Translate the following text to {target_lang}. "
    "Preserve the original formatting, including markdown, paragraphs, and line breaks. "
    "Do not add any extra comments, explanations, or introductory phrases. "
    "Just provide the direct translation.\n\n"
    "Original text:\n"
    "{text}"
)

async def translate_text(
    text: str,
    target_lang: str,
    custom_prompt_template: str | None = None
) -> str:
    """
    Translates text using the OpenAI API.

    Args:
        text: The text to translate.
        target_lang: The target language code (e.g., "EN", "RU").
        custom_prompt_template: An optional f-string template for the prompt.
                               Must contain {target_lang} and {text} placeholders.

    Returns:
        The translated text, or the original text if an error occurs.
    """
    if not text or not text.strip():
        return ""
        
    prompt_template = custom_prompt_template or DEFAULT_PROMPT_TEMPLATE
    final_prompt = prompt_template.format(target_lang=target_lang, text=text)

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # Или gpt-3.5-turbo для скорости
            messages=[
                {"role": "system", "content": "You are a professional translator."},
                {"role": "user", "content": final_prompt}
            ],
            temperature=0.3, # Более низкая температура для более точного перевода
        )
        translated_text = response.choices[0].message.content.strip()
        return translated_text
    except Exception as e:
        print(f"An error occurred during translation: {e}")
        # В случае ошибки возвращаем оригинальный текст, чтобы не терять контент
        return text
