# 🌍 Translation Service

Микросервис для перевода текста через OpenAI API с поддержкой Firebase интеграции.

## 🚀 Возможности

- **Перевод через OpenAI API** - поддержка GPT-3.5-turbo и GPT-4
- **Массовый перевод** - обработка множества текстов за один запрос
- **REST API** - простые HTTP эндпоинты
- **Конфигурируемость** - настройка через переменные окружения
- **Firebase интеграция** - закомментирована (можно включить при необходимости)

## 📁 Структура

```
translation-service/
├── server.js              # Основной сервер
├── package.json           # Зависимости
├── env.example           # Пример конфигурации
├── test-translation.js   # Тестовый скрипт
└── README.md             # Документация
```

## 🛠 Установка

1. **Установка зависимостей:**
```bash
cd translation-service
npm install
```

2. **Настройка окружения:**
```bash
cp env.example .env
# Отредактируйте .env файл с вашими API ключами
```

3. **Запуск сервиса:**
```bash
# Разработка
npm run dev

# Продакшн
npm start
```

## ⚙️ Конфигурация

### Переменные окружения (.env):

```env
# OpenAI API
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
TARGET_LANGUAGE=English
MAX_TOKENS=1000
TEMPERATURE=0.3

# Сервер
PORT=3001

# Firebase (закомментировано пока не нужен)
# FIREBASE_PROJECT_ID=your-project-id
# GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## 🔧 API Endpoints

### POST /translate
Переводит один текст.

**Запрос:**
```json
{
  "text": "Привет, как дела?",
  "targetLanguage": "English",
  "model": "gpt-3.5-turbo"
}
```

**Ответ:**
```json
{
  "success": true,
  "original": "Привет, как дела?",
  "translated": "Hello, how are you?",
  "config": { ... }
}
```

### POST /translate/batch
Переводит массив текстов.

**Запрос:**
```json
{
  "texts": ["Привет", "Как дела?"],
  "targetLanguage": "English"
}
```

**Ответ:**
```json
{
  "success": true,
  "results": [
    { "original": "Привет", "translated": "Hello", "success": true },
    { "original": "Как дела?", "translated": "How are you?", "success": true }
  ],
  "total": 2,
  "successful": 2
}
```

### GET /config
Возвращает текущую конфигурацию.

### GET /health
Проверка состояния сервиса.

### POST /firebase/save (закомментировано)
Сохранение данных в Firebase - функция закомментирована.

## 🧪 Тестирование

```bash
# Запуск тестового скрипта
npm test

# Или напрямую
node test-translation.js
```

## 🔗 Интеграция с React

Сервис интегрируется с React приложением через:

1. **Translation Service** (`src/services/translation.js`)
2. **useTranslation Hook** (`src/hooks/useTranslation.js`)
3. **TranslationTester Component** (`src/components/TranslationTester.js`)

### Пример использования:

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

## 🚀 Развертывание

### Локально:
```bash
npm start
```

### Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Heroku/Vercel:
Добавьте переменные окружения и деплойте как обычное Node.js приложение.

## 📊 Мониторинг

- **Health Check**: `GET /health`
- **Логи**: Все запросы логируются в консоль
- **Ошибки**: Детальная информация об ошибках в ответах API

## 🔒 Безопасность

- API ключи хранятся в переменных окружения
- CORS настроен для локальной разработки
- Валидация входных данных
- Обработка ошибок OpenAI API

## 💡 Примеры использования

### Telegram Bot:
```javascript
// Переводим сообщения перед отправкой
const translated = await translationService.translateText(message.text);
await bot.sendMessage(chatId, translated);
```

### Firebase Functions:
```javascript
// Сохраняем переведенные данные
await translationService.saveToFirebase('messages', {
  original: text,
  translated: translatedText,
  timestamp: new Date()
});
```

### Batch Processing:
```javascript
// Переводим множество текстов
const results = await translationService.translateBatch(texts);
// results содержит массив переведенных текстов
```
