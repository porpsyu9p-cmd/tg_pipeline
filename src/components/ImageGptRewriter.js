import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { translationService } from '../services/translation';

export default function ImageGptRewriter() {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [resultImage, setResultImage] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const onSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    setIsLoading(true);
    setResultImage(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = String(ev.target.result).split(',')[1];
        const { imageBase64 } = await translationService.translateImageWithGpt(base64, { targetLanguage: 'English', size: '1024x1024' });
        setResultImage(`data:image/png;base64,${imageBase64}`);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <Card className='shadow-2xl bg-black/80 backdrop-blur-sm border-gray-800'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'>
          GPT визуальный перевод (эксперимент)
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <input type='file' accept='image/*' onChange={onSelect} />
        {preview && (
          <div className='space-y-2'>
            <p className='text-sm text-gray-300'>Оригинал:</p>
            <img src={preview} alt='preview' className='max-w-full rounded border' />
          </div>
        )}

        <div className='flex gap-2'>
          <Button onClick={run} disabled={!file || isLoading}>
            {isLoading ? 'Processing...' : 'Translate with GPT'}
          </Button>
          <Button onClick={clearAll} variant='outline'>Очистить</Button>
        </div>

        {resultImage && (
          <div className='space-y-2'>
            <p className='text-sm text-gray-300'>Результат (может немного отличаться):</p>
            <img src={resultImage} alt='result' className='max-w-full rounded border bg-white' />
            <Button
              variant='outline'
              onClick={() => {
                const a = document.createElement('a');
                a.href = resultImage;
                a.download = 'gpt-translated.png';
                a.click();
              }}
              size='sm'
            >Скачать</Button>
          </div>
        )}

        {error && (
          <Alert variant='destructive'>
            <p>{error}</p>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}


