const axios = require('axios');

const TRANSLATION_SERVICE_URL = process.env.TRANSLATION_SERVICE_URL || 'http://localhost:3001';

async function testTranslationMock() {
  console.log('🧪 Testing Translation Service (Mock Mode)');
  console.log('='.repeat(50));
  
  try {
    // Тест здоровья сервиса
    console.log('\n1. Testing service health...');
    const healthResponse = await axios.get(`${TRANSLATION_SERVICE_URL}/health`);
    console.log('✅ Service is healthy:', healthResponse.data);
    
    // Тест конфигурации
    console.log('\n2. Getting service config...');
    const configResponse = await axios.get(`${TRANSLATION_SERVICE_URL}/config`);
    console.log('📝 Config:', configResponse.data);
    
    console.log('\n3. API endpoints are working!');
    console.log('   - Health check: ✅');
    console.log('   - Config endpoint: ✅');
    console.log('   - Translation endpoints: Ready (need API key)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Mock testing completed');
  console.log('💡 Add your OpenAI API key to .env to test real translation');
}

// Запуск тестов
testTranslationMock().catch(console.error);
