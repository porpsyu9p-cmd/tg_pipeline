import { useState, useCallback } from 'react';
import { translationService } from '../services/translation';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  const translateText = useCallback(async (text, options = {}) => {
    if (!text || !text.trim()) {
      return text;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translationService.translateText(text, options);
      return result.translated;
    } catch (err) {
      setError(err.message);
      console.error('Translation error:', err);
      return text; // Возвращаем оригинал при ошибке
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const translateBatch = useCallback(async (texts, options = {}) => {
    if (!texts || texts.length === 0) {
      return [];
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translationService.translateBatch(texts, options);
      return result.results.map(r => r.translated);
    } catch (err) {
      setError(err.message);
      console.error('Batch translation error:', err);
      return texts; // Возвращаем оригиналы при ошибке
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const result = await translationService.getConfig();
      setConfig(result.config);
      return result.config;
    } catch (err) {
      setError(err.message);
      console.error('Config load error:', err);
      return null;
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const result = await translationService.checkHealth();
      return result.status === 'healthy';
    } catch (err) {
      console.error('Health check error:', err);
      return false;
    }
  }, []);

  const translateImage = useCallback(async (imageBase64, options = {}) => {
    if (!imageBase64) {
      return null;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translationService.translateImage(imageBase64, options);
      return result.translated;
    } catch (err) {
      setError(err.message);
      console.error('Image translation error:', err);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return {
    translateText,
    translateBatch,
    translateImage,
    loadConfig,
    checkHealth,
    isTranslating,
    error,
    config,
  };
};
