const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');
// const admin = require('firebase-admin'); // Закомментировано пока не нужен

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для изображений
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Инициализация Firebase Admin (закомментировано пока не нужен)
// let firebaseApp = null;
// if (process.env.FIREBASE_PROJECT_ID) {
//   try {
//     firebaseApp = admin.initializeApp({
//       credential: admin.credential.applicationDefault(),
//       projectId: process.env.FIREBASE_PROJECT_ID,
//     });
//     console.log('✅ Firebase Admin initialized');
//   } catch (error) {
//     console.log('⚠️ Firebase Admin not configured:', error.message);
//   }
// }

// Конфигурация перевода
const TRANSLATION_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  targetLanguage: process.env.TARGET_LANGUAGE || 'English',
  maxTokens: parseInt(process.env.MAX_TOKENS) || 1000,
  temperature: parseFloat(process.env.TEMPERATURE) || 0.3,
};

// Вспомогательные детекторы языка результата (минимальная эвристика)
function containsCyrillic(s = '') {
  return /[А-Яа-яЁё]/.test(s);
}
function looksEnglish(s = '') {
  return /[A-Za-z]/.test(s) && !containsCyrillic(s);
}

// Функция перевода
async function translateText(text, options = {}) {
  if (!text || !text.trim()) {
    return text;
  }

  const config = { ...TRANSLATION_CONFIG, ...options };
  const modelToUse = (config.model && String(config.model).trim()) || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  try {
    const targetLang = String(config.targetLanguage || 'English');

    // Поддержка новых моделей responses API, если доступен SDK v4.55+
    if (typeof openai.responses?.create === 'function') {
      const baseInput = [
        { role: 'system', content: `You are a precise translation engine. Translate to ${targetLang}. Output ${targetLang} only, no explanations, no source words, do not change person or style.` },
        { role: 'user', content: text }
      ];

      const response = await openai.responses.create({
        model: modelToUse,
        input: baseInput,
        max_output_tokens: config.maxTokens,
        temperature: 0,
      });

      let translated = response?.output?.[0]?.content?.[0]?.text ||
                       response?.output_text ||
                       response?.choices?.[0]?.message?.content || '';
      translated = (translated || '').trim();

      // Повторная попытка при неверном языке (например, осталась кириллица)
      if (targetLang.toLowerCase().startsWith('english') && !looksEnglish(translated)) {
        const strictResponse = await openai.responses.create({
          model: modelToUse,
          input: [
            { role: 'system', content: `Strictly translate the user text to English. Return English letters only. Do not paraphrase or change pronouns. Only the translation.` },
            { role: 'user', content: text }
          ],
          max_output_tokens: config.maxTokens,
          temperature: 0,
        });
        translated = (strictResponse?.output_text || '').trim();
      }

      console.log(`Translation: "${text.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
      return translated || text;
    }

    // Fallback на chat.completions (более старый путь)
    const baseMessages = [
      { role: 'system', content: `You are a precise translation engine. Translate to ${targetLang}. Output ${targetLang} only, no explanations, no source words, do not change person or style.` },
      { role: 'user', content: text }
    ];
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: baseMessages,
      max_tokens: config.maxTokens,
      temperature: 0,
    });

    let translated = (response.choices?.[0]?.message?.content || '').trim();
    if (targetLang.toLowerCase().startsWith('english') && !looksEnglish(translated)) {
      const strict = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: 'system', content: `Strictly translate the user text to English. Return English letters only. Do not paraphrase or change pronouns. Only the translation.` },
          { role: 'user', content: text }
        ],
        max_tokens: config.maxTokens,
        temperature: 0,
      });
      translated = (strict.choices?.[0]?.message?.content || '').trim();
    }

    console.log(`Translation: "${text.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

// Функция перевода изображений через GPT Vision
async function translateImage(imageBase64, options = {}) {
  const config = { ...TRANSLATION_CONFIG, ...options };
  const modelToUse = (config.model && String(config.model).trim()) || 'gpt-4o';
  const targetLang = String(config.targetLanguage || 'English');

  try {
    console.log(`[image-translate] model=${modelToUse}, targetLanguage=${targetLang}`);

    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Translate all text visible in this image to ${targetLang}. Return only the translation, no explanations. If there's no text, return "No text found".`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0,
    });

    const translated = (response.choices?.[0]?.message?.content || '').trim();
    console.log(`Image translation result: "${translated.substring(0, 100)}..."`);
    
    return translated;
  } catch (error) {
    console.error('Image translation error:', error);
    throw new Error(`Image translation failed: ${error.message}`);
  }
}

// API Routes

// Тест перевода
app.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, model } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const translated = await translateText(text, { targetLanguage, model });
    
    res.json({
      success: true,
      original: text,
      translated: translated,
      config: TRANSLATION_CONFIG,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Массовый перевод
app.post('/translate/batch', async (req, res) => {
  try {
    const { texts, targetLanguage, model } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required' });
    }
    
    const results = [];
    for (const text of texts) {
      try {
        const translated = await translateText(text, { targetLanguage, model });
        results.push({ original: text, translated, success: true });
      } catch (error) {
        results.push({ original: text, translated: text, success: false, error: error.message });
      }
    }
    
    res.json({
      success: true,
      results,
      total: texts.length,
      successful: results.filter(r => r.success).length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// --- GPT Image rewrite (экспериментально): генерирует новое изображение на основе оригинала ---
// Ограничение: gpt-image-1 возвращает квадрат (например 1024x1024), итог может отличаться от оригинала
app.post('/translate/image-gpt', async (req, res) => {
  try {
    const { imageBase64, targetLanguage, size } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Записываем во временный файл
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-'));
    const inPath = path.join(tmpDir, 'input.png');
    fs.writeFileSync(inPath, Buffer.from(imageBase64, 'base64'));

    const prompt = `Translate all visible text in this image to ${targetLanguage || 'English'}. Preserve layout, typography, colors and the rest of the image as much as possible. Minimal changes beyond translated text.`;

    // Внимание: images.edits принимает stream
    const stream = fs.createReadStream(inPath);
    const result = await openai.images.edit({
      model: 'gpt-image-1',
      image: stream,
      prompt,
      size: size || '1024x1024',
      n: 1,
    });

    const b64 = result?.data?.[0]?.b64_json;
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

    if (!b64) {
      return res.status(500).json({ success: false, error: 'No image produced' });
    }
    return res.json({ success: true, imageBase64: b64 });
  } catch (error) {
    console.error('Image GPT rewrite error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Перевод изображений
app.post('/translate/image', async (req, res) => {
  try {
    const { imageBase64, targetLanguage, model } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }
    
    const translated = await translateImage(imageBase64, { targetLanguage, model });
    
    res.json({
      success: true,
      translated: translated,
      config: TRANSLATION_CONFIG,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Получение конфигурации
app.get('/config', (req, res) => {
  res.json({
    config: TRANSLATION_CONFIG,
    firebase: false, // Закомментировано пока не нужен
  });
});

// Тест подключения
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    openai: !!process.env.OPENAI_API_KEY,
    firebase: false, // Закомментировано пока не нужен
  });
});

// Firebase интеграция (закомментировано пока не нужна)
// if (firebaseApp) {
//   // Сохранение переведенных текстов в Firebase
//   app.post('/firebase/save', async (req, res) => {
//     try {
//       const { collection, data } = req.body;
//       
//       if (!collection || !data) {
//         return res.status(400).json({ error: 'Collection and data are required' });
//       }
//       
//       const db = admin.firestore();
//       const docRef = await db.collection(collection).add(data);
//       
//       res.json({
//         success: true,
//         id: docRef.id,
//         message: 'Data saved to Firebase',
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: error.message,
//       });
//     }
//   });
// }

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Translation service running on port ${PORT}`);
  console.log(`📝 OpenAI model: ${TRANSLATION_CONFIG.model}`);
  console.log(`🌍 Target language: ${TRANSLATION_CONFIG.targetLanguage}`);
  console.log(`🔥 Firebase: Disabled (commented out)`);
});

module.exports = app;
