import axios from 'axios';

class TranslationService {
  constructor() {
    this.baseURL = process.env.REACT_APP_TRANSLATION_SERVICE_URL || 'http://localhost:3001';
  }

  async translateText(text, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/translate`, {
        text,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(error.response?.data?.error || 'Translation failed');
    }
  }

  async translateBatch(texts, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/translate/batch`, {
        texts,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Batch translation error:', error);
      throw new Error(error.response?.data?.error || 'Batch translation failed');
    }
  }

  async getConfig() {
    try {
      const response = await axios.get(`${this.baseURL}/config`);
      return response.data;
    } catch (error) {
      console.error('Config fetch error:', error);
      throw new Error('Failed to fetch translation config');
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  async translateImage(imageBase64, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/translate/image`, {
        imageBase64,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Image translation error:', error);
      throw new Error(error.response?.data?.error || 'Image translation failed');
    }
  }

  async translateImageWithGpt(imageBase64, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/translate/image-gpt`, {
        imageBase64,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Image GPT rewrite error:', error);
      throw new Error(error.response?.data?.error || 'Image GPT rewrite failed');
    }
  }

  // Firebase интеграция (закомментировано пока не нужна)
  // async saveToFirebase(collection, data) {
  //   try {
  //     const response = await axios.post(`${this.baseURL}/firebase/save`, {
  //       collection,
  //       data
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error('Firebase save error:', error);
  //     throw new Error(error.response?.data?.error || 'Failed to save to Firebase');
  //   }
  // }
}

export const translationService = new TranslationService();
