import axios from 'axios';

// Настройка axios для логирования
axios.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

class PipelineAPI {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  async getStatus() {
    const response = await axios.get(`${this.baseURL}/status`);
    return response.data;
  }

  async runPipeline(limit) {
    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }

    const response = await axios.post(`${this.baseURL}/run`, { limit });
    return response.data;
  }

  async stopPipeline() {
    const response = await axios.post(`${this.baseURL}/stop`);
    return response.data;
  }
}

export const pipelineAPI = new PipelineAPI();
