import { useState } from 'react';
import { translateText } from '../services/api';

export const useTranslation = () => {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  const handleTranslate = async (text, lang, prompt) => {
    if (!text || !text.trim()) {
      setTranslationError('Text for translation cannot be empty.');
      return;
    }
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const response = await translateText(text, lang, prompt);
      if (response.data.ok) {
        setTranslatedText(response.data.translated_text);
      } else {
        throw new Error(response.data.error || 'Failed to translate');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'An unknown error occurred';
      setTranslationError(errorMsg);
      setTranslatedText(''); // Clear previous successful translation
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translatedText,
    isTranslating,
    translationError,
    handleTranslate,
  };
};
