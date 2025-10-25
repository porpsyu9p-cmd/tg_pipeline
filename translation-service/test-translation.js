const axios = require('axios');

const TRANSLATION_SERVICE_URL = process.env.TRANSLATION_SERVICE_URL || 'http://localhost:3001';

async function testTranslation() {
  console.log('🧪 Testing Translation Service');
  console.log('='.repeat(50));
  
  const testTexts = [
    'Привет, как дела?',
    'Сегодня отличная погода!',
    'Я изучаю программирование на JavaScript.',
    'Это очень интересный проект.',
    'Спасибо за помощь!'
  ];
  
  try {
    // Тест здоровья сервиса
    console.log('\n1. Testing service health...');
    const healthResponse = await axios.get(`${TRANSLATION_SERVICE_URL}/health`);
    console.log('✅ Service is healthy:', healthResponse.data);
    
    // Тест конфигурации
    console.log('\n2. Getting service config...');
    const configResponse = await axios.get(`${TRANSLATION_SERVICE_URL}/config`);
    console.log('📝 Config:', configResponse.data);
    
    // Тест одиночного перевода
    console.log('\n3. Testing single translation...');
    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      console.log(`\n${i + 1}. Original: ${text}`);
      
      const response = await axios.post(`${TRANSLATION_SERVICE_URL}/translate`, {
        text: text,
        targetLanguage: 'English'
      });
      
      if (response.data.success) {
        console.log(`   Translated: ${response.data.translated}`);
      } else {
        console.log(`   ❌ Error: ${response.data.error}`);
      }
    }
    
    // Тест массового перевода
    console.log('\n4. Testing batch translation...');
    const batchResponse = await axios.post(`${TRANSLATION_SERVICE_URL}/translate/batch`, {
      texts: testTexts,
      targetLanguage: 'English'
    });
    
    if (batchResponse.data.success) {
      console.log(`✅ Batch translation completed:`);
      console.log(`   Total: ${batchResponse.data.total}`);
      console.log(`   Successful: ${batchResponse.data.successful}`);
      
      batchResponse.data.results.forEach((result, index) => {
        if (result.success) {
          console.log(`   ${index + 1}. ${result.original} -> ${result.translated}`);
        } else {
          console.log(`   ${index + 1}. ❌ ${result.original} (${result.error})`);
        }
      });
    } else {
      console.log(`❌ Batch translation failed: ${batchResponse.data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Testing completed');
}

// Запуск тестов
testTranslation().catch(console.error);
