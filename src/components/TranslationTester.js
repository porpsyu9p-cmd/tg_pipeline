import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert } from './ui/alert';

const TranslationTester = () => {
  const { translateText, translateImage, loadConfig, checkHealth, isTranslating, error, config } = useTranslation();
  const [testText, setTestText] = useState('Привет, как дела?');
  const [translatedText, setTranslatedText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [translatedImageText, setTranslatedImageText] = useState('');
  const [isHealthy, setIsHealthy] = useState(null);

  useEffect(() => {
    loadConfig();
    checkHealth().then(setIsHealthy);
  }, [loadConfig, checkHealth]);

  const handleSingleTranslation = async () => {
    const result = await translateText(testText);
    setTranslatedText(result);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageTranslation = async () => {
    if (!selectedImage) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]; // Убираем data:image/jpeg;base64,
      const result = await translateImage(base64);
      setTranslatedImageText(result);
    };
    reader.readAsDataURL(selectedImage);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setTranslatedImageText('');
  };

  // batch UI удалён по просьбе пользователя

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isHealthy === true ? 'bg-green-500' : isHealthy === false ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span>
              {isHealthy === true ? 'Service is healthy' : 
               isHealthy === false ? 'Service is down' : 
               'Checking...'}
            </span>
          </div>
          {config && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Model: {config.model}</p>
              <p>Target Language: {config.targetLanguage}</p>
              <p>Max Tokens: {config.maxTokens}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Translation */}
      <Card>
        <CardHeader>
          <CardTitle>Single Translation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Text to translate:</label>
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to translate"
            />
          </div>
          <Button 
            onClick={handleSingleTranslation} 
            disabled={isTranslating || !testText.trim()}
            className="w-full"
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </Button>
          {translatedText && (
            <div className="p-3 bg-gray-100 rounded">
              <p className="text-sm font-medium">Translated:</p>
              <p>{translatedText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Translation */}
      <Card>
        <CardHeader>
          <CardTitle>Image Translation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {imagePreview && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full h-48 object-contain border rounded"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleImageTranslation} 
                  disabled={isTranslating}
                  className="flex-1"
                >
                  {isTranslating ? 'Translating...' : 'Translate Image'}
                </Button>
                <Button 
                  onClick={clearImage}
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
              
              {translatedImageText && (
                <div className="p-3 bg-gray-100 rounded">
                  <p className="text-sm font-medium">Translated text from image:</p>
                  <p>{translatedImageText}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Translation removed */}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <p className="font-medium">Translation Error:</p>
          <p>{error}</p>
        </Alert>
      )}
    </div>
  );
};

export default TranslationTester;
