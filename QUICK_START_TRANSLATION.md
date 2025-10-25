# 🚀 Быстрый старт Translation Service

## 1. Настройка сервиса перевода

```bash
# Переходим в папку сервиса
cd translation-service

# Устанавливаем зависимости
npm install

# Копируем пример конфигурации
cp env.example .env

# Редактируем .env файл - добавляем ваш OpenAI API ключ
# OPENAI_API_KEY=sk-your-actual-api-key-here
```

## 2. Запуск сервиса

```bash
# Запуск в режиме разработки
npm run dev

# Или обычный запуск
npm start
```

Сервис будет доступен на `http://localhost:3001`

## 3. Тестирование

```bash
# Запуск тестового скрипта
npm test
```

Или через curl:
```bash
curl -X POST "http://localhost:3001/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Привет, как дела?"}'
```

## 4. Интеграция с React

Добавьте в `.env` React приложения:
```
REACT_APP_TRANSLATION_SERVICE_URL=http://localhost:3001
```

## 5. Использование в коде

```javascript
import { useTranslation } from './hooks/useTranslation';

function MyComponent() {
  const { translateText, isTranslating } = useTranslation();
  
  const handleTranslate = async () => {
    const translated = await translateText('Привет!');
    console.log(translated); // "Hello!"
  };
  
  return (
    <button onClick={handleTranslate} disabled={isTranslating}>
      {isTranslating ? 'Translating...' : 'Translate'}
    </button>
  );
}
```

## 6. Firebase интеграция (закомментирована)

Firebase интеграция временно закомментирована. Если понадобится:

1. Раскомментируйте код в `server.js`
2. Добавьте `firebase-admin` в `package.json`
3. Настройте переменные окружения в `.env`

## 7. Готово! 🎉

Теперь у вас есть:
- ✅ Микросервис перевода на Node.js
- ✅ REST API для интеграции
- ✅ React хуки и компоненты
- ✅ Тестовые функции
- ✅ Документация
- ⏸️ Firebase интеграция (закомментирована)

Сервис готов к использованию! Firebase интеграцию можно включить позже при необходимости.
