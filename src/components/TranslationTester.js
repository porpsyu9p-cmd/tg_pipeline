import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

const TranslationTester = () => {
  const { translatedText, isTranslating, translationError, handleTranslate } = useTranslation();
  const [testText, setTestText] = useState('Привет, как дела?');
  const [targetLang, setTargetLang] = useState('EN');

  const handleSubmit = () => {
    if (testText.trim()) {
      handleTranslate(testText, targetLang, null);
    }
  };

  return (
    <Card className='shadow-2xl bg-black/80 backdrop-blur-sm border-gray-800'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'>
          Тест перевода (ChatGPT)
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Текст для перевода:
          </label>
          <Input
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder='Введите текст для перевода'
            className='bg-gray-900/50 border-gray-700 text-white placeholder-gray-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>Целевой язык:</label>
          <Input
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            placeholder='EN, RU, ES...'
            className='bg-gray-900/50 border-gray-700 text-white placeholder-gray-500'
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isTranslating || !testText.trim()}
          className='w-full'
        >
          {isTranslating ? 'Перевожу...' : 'Перевести'}
        </Button>

        {translationError && (
          <div className='p-3 bg-red-900/50 border border-red-700 rounded text-red-200'>
            <p className='text-sm font-medium'>Ошибка:</p>
            <p className='text-sm'>{translationError}</p>
          </div>
        )}

        {translatedText && (
          <div className='p-3 bg-gray-900/50 border border-gray-700 rounded'>
            <p className='text-sm font-medium text-gray-300 mb-2'>Перевод:</p>
            <p className='text-white'>{translatedText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslationTester;
