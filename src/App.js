import React from 'react';
import { usePipeline } from './hooks/usePipeline';
import { usePostLimit } from './hooks/usePostLimit';
import StatusIndicator from './components/StatusIndicator';
import { ProgressSection } from './components/ProgressSection';
import { ControlButtons } from './components/ControlButtons';
import { MessageAlerts } from './components/MessageAlerts';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';

function App() {
  const {
    status,
    isLoading,
    error,
    success,
    fetchStatus,
    runPipeline,
    stopPipeline,
    clearMessages,
  } = usePipeline();
  const { postLimit, validationError, handlePostLimitChange } = usePostLimit();

  const handleRun = () => {
    if (validationError) return;
    runPipeline(postLimit);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4'>
              🤖 Telegram Pipeline
            </h1>
            <p className='text-gray-400 text-lg'>
              Автоматический парсер и пересылка контента из Telegram каналов
            </p>
          </div>

          {/* Main Card */}
          <Card className='shadow-2xl bg-black/80 backdrop-blur-sm border-gray-800'>
            <CardHeader>
              <CardTitle className='text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'>
                Управление парсером
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Status Section */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-300'>Статус</h3>
                <StatusIndicator
                  isRunning={status.is_running}
                  finished={status.finished}
                  processed={status.processed}
                  total={status.total}
                />
              </div>

              {/* Progress Section */}
              {status.total > 0 && (
                <ProgressSection processed={status.processed} total={status.total} />
              )}

              {/* Control Section */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-300'>Управление</h3>

                <div className='flex flex-col sm:flex-row gap-4 items-end'>
                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-gray-400 mb-2'>
                      Лимит постов
                    </label>
                    <Input
                      type='number'
                      value={postLimit}
                      onChange={handlePostLimitChange}
                      placeholder='Введите лимит постов'
                      min='1'
                      max='1000'
                      disabled={status.is_running}
                      className='bg-gray-900/50 border-gray-700 text-white placeholder-gray-500'
                    />
                    {validationError && (
                      <p className='text-red-400 text-sm mt-1'>{validationError}</p>
                    )}
                  </div>

                  <ControlButtons
                    onRun={handleRun}
                    onStop={stopPipeline}
                    isRunning={status.is_running}
                    disabled={!!validationError}
                  />
                </div>
              </div>

              {/* Messages */}
              <MessageAlerts error={error} success={success} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
