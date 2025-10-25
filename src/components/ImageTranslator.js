import React from 'react';
import Tesseract from 'tesseract.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';

// Упрощённый компонент: распознаёт текст (OCR), отправляет его в GPT для перевода,
// затем перерисовывает поверх изображения переведённый текст (без точного позиционирования пословно).
// Это MVP: точная замена на исходных координатах требует детектора блоков/строк и сегментации, что можно расширить позже.

export default function ImageTranslator({ translateText }) {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [translated, setTranslated] = React.useState('');
  const [resultImage, setResultImage] = React.useState(null);
  const [progress, setProgress] = React.useState(0);
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
    setProgress(0);
    setTranslated('');
    setResultImage(null);

    // 1) OCR через Tesseract
    const { data } = await Tesseract.recognize(file, 'rus+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && m.progress) setProgress(Math.round(m.progress * 100));
      },
    });
    const originalText = (data?.text || '').trim();
    if (!originalText) {
      setError('Не удалось распознать текст на изображении');
      return;
    }

    // 2) Перевод распознанного текста через существующий translateText
    const translatedText = await translateText(originalText);
    setTranslated(translatedText);

    // 3) Генерация изображения с переведённым текстом (снизу, без изменения исходных пикселей)
    const img = new Image();
    img.onload = () => {
      const padding = 40;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const baseWidth = img.width;

      // перенос строк по ширине
      ctx.font = 'bold 20px Arial';
      const words = translatedText.split(' ');
      const maxWidth = baseWidth - padding * 2;
      const lineHeight = 28;
      const lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth) {
          if (line) lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);

      const textBlockHeight = lines.length * lineHeight + padding * 2;
      canvas.width = baseWidth;
      canvas.height = img.height + textBlockHeight;

      // фон: исходная картинка + белая плашка для текста ниже
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // текстовая плашка снизу
      ctx.fillStyle = 'white';
      ctx.fillRect(0, img.height, canvas.width, textBlockHeight);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      lines.forEach((l, i) => {
        ctx.fillText(l, padding, img.height + padding + i * lineHeight);
      });

      setResultImage(canvas.toDataURL('image/png'));
    };
    img.onerror = () => setError('Ошибка загрузки изображения');
    img.src = preview;
  };

  return (
    <Card className='shadow-2xl bg-black/80 backdrop-blur-sm border-gray-800'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'>
          Перевод изображения (MVP)
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <input type='file' accept='image/*' onChange={onSelect} />
        {preview && <img src={preview} alt='preview' className='max-w-full rounded border' />}
        {progress > 0 && progress < 100 && <div className='text-sm text-gray-300'>OCR: {progress}%</div>}
        <div className='flex gap-2'>
          <Button onClick={run} disabled={!file}>Распознать и перевести</Button>
        </div>
        {translated && (
          <div className='p-3 bg-gray-100 rounded'>
            <p className='text-sm font-medium'>Переведённый текст:</p>
            <p className='text-black'>{translated}</p>
          </div>
        )}
        {resultImage && (
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Изображение с переведённым текстом (снизу):</p>
            <img src={resultImage} alt='result' className='max-w-full rounded border bg-white' />
            <Button
              variant='outline'
              onClick={() => {
                const a = document.createElement('a');
                a.href = resultImage;
                a.download = 'translated.png';
                a.click();
              }}
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


