import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});

class PipelineAPI {
  run(limit = 100, period_hours = null) {
    return api.post('/run', { limit, period_hours });
  }

  stop() {
    return api.post('/stop');
  }

  status() {
    return api.get('/status');
  }
}

export const pipelineAPI = new PipelineAPI();

// Обновленный эндпоинт для перевода
export const translateText = (text, target_lang = 'EN', prompt = null) => {
  return api.post('/translate', { text, target_lang, prompt });
};

// --- API для работы с постами ---

export const getPosts = () => {
  return api.get('/posts');
};

export const translatePost = (postId, target_lang = 'EN') => {
  return api.post(`/posts/${postId}/translate`, { target_lang });
};
