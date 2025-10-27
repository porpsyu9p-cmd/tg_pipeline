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
    <Card className='shadow-sm border border-gray-200 bg-white'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold text-gray-900'>Тест перевода</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Текст для перевода</label>
          <Input
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder='Введите текст'
            className='border-gray-300'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Целевой язык</label>
          <Input
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            placeholder='EN, RU, ES...'
            className='border-gray-300'
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isTranslating || !testText.trim()}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white'
        >
          {isTranslating ? 'Перевожу...' : 'Перевести'}
        </Button>

        {translationError && (
          <div className='p-3 bg-red-50 border border-red-200 rounded text-red-700'>
            <p className='text-sm font-medium'>Ошибка:</p>
            <p className='text-sm'>{translationError}</p>
          </div>
        )}

        {translatedText && (
          <div className='p-3 bg-gray-50 border border-gray-200 rounded'>
            <p className='text-sm font-medium text-gray-700 mb-2'>Перевод:</p>
            <p className='text-gray-900'>{translatedText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslationTester;
