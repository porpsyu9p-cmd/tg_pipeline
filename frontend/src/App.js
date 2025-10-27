import React from 'react';
import { usePipeline } from './hooks/usePipeline';
import { usePostLimit } from './hooks/usePostLimit';
import { saveChannel, checkChannel, deleteCurrentChannel, getCurrentChannel } from './services/api';
import StatusIndicator from './components/StatusIndicator';
import { ProgressSection } from './components/ProgressSection';
import { ControlButtons } from './components/ControlButtons';
import { MessageAlerts } from './components/MessageAlerts';
import { Card, CardContent } from './components/ui/card';
import { NumberInput } from './components/ui/number-input';
import { Switch } from './components/ui/switch';
import { ChannelInput } from './components/ui/channel-input';
import PostsList from './components/PostsList';

function App() {
  const { status, error, success, runPipeline, stopPipeline } = usePipeline();
  const { postLimit, validationError, handlePostLimitChange } = usePostLimit();
  const [periodHours, setPeriodHours] = React.useState(1);
  const [channelUsername, setChannelUsername] = React.useState('');
  const [isChannelSaved, setIsChannelSaved] = React.useState(false);
  const [isTopPosts, setIsTopPosts] = React.useState(false);

  // Загружаем сохраненный канал при инициализации
  React.useEffect(() => {
    // Сначала пробуем загрузить из Firebase
    getCurrentChannel()
      .then((response) => {
        if (response.data.channel && response.data.channel.username) {
          const username = response.data.channel.username;
          setChannelUsername(username);
          setIsChannelSaved(true);
          // Сохраняем в localStorage для быстрого доступа
          localStorage.setItem('lastUsedChannel', username);
        } else {
          // Если в Firebase нет канала, пробуем localStorage
          const savedChannel = localStorage.getItem('lastUsedChannel');
          if (savedChannel) {
            setChannelUsername(savedChannel);
            setIsChannelSaved(false); // Не сохранен в Firebase
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load saved channel:', err);
        // Fallback к localStorage
        const savedChannel = localStorage.getItem('lastUsedChannel');
        if (savedChannel) {
          setChannelUsername(savedChannel);
          setIsChannelSaved(false);
        }
      });
  }, []);

  const handleRun = () => {
    if (validationError) return;
    // Преобразуем username в полный URL для бэкенда
    const channelUrl = channelUsername.startsWith('@')
      ? `t.me/${channelUsername.slice(1)}`
      : `t.me/${channelUsername}`;
    runPipeline(postLimit, periodHours, channelUrl, isTopPosts);
  };

  const handleChannelSave = async (username) => {
    if (!username.trim()) {
      return;
    }

    try {
      const response = await saveChannel(username);
      if (response.data.ok) {
        setIsChannelSaved(true);
        console.log('Channel saved successfully');
      }
    } catch (err) {
      console.error('Failed to save channel:', err);
      alert('Ошибка при сохранении канала');
    }
  };

  const handleChannelUnsave = async (username) => {
    if (!username.trim()) {
      return;
    }

    try {
      const response = await deleteCurrentChannel();
      if (response.data.ok) {
        setIsChannelSaved(false);
        console.log('Channel removed successfully');
      }
    } catch (err) {
      console.error('Failed to unsave channel:', err);
      alert('Ошибка при удалении канала');
    }
  };

  const handleChannelChange = async (username) => {
    setChannelUsername(username);

    // Сохраняем в localStorage
    if (username.trim()) {
      localStorage.setItem('lastUsedChannel', username);
    } else {
      localStorage.removeItem('lastUsedChannel');
    }

    // Сбрасываем состояние при очистке поля
    if (!username.trim()) {
      setIsChannelSaved(false);
      return;
    }

    // Проверяем, сохранен ли канал
    try {
      const response = await checkChannel(username);
      setIsChannelSaved(response.data.is_saved);
    } catch (err) {
      console.error('Failed to check channel:', err);
      setIsChannelSaved(false);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-2xl font-bold mb-1'>Parser322</h1>
        </div>

        {/* Main Card */}
        <Card className='shadow-sm rounded-lg'>
          <CardContent className='p-6 space-y-6'>
            {/* Channel Input Section */}
            <div>
              <label className='block text-sm font-medium mb-2'>Канал</label>
              <ChannelInput
                value={channelUsername}
                onChange={handleChannelChange}
                onSave={handleChannelSave}
                onUnsave={handleChannelUnsave}
                isSaved={isChannelSaved}
                disabled={status.is_running}
                placeholder='канал'
              />
            </div>

            <hr className='border-border' />

            {/* Controls Section - Horizontal Layout */}
            <div className='flex items-start gap-8 h-20'>
              {/* Number Controls */}
              <div className='flex gap-8'>
                <NumberInput
                  label='Количество постов'
                  value={postLimit}
                  onChange={(value) =>
                    handlePostLimitChange({ target: { value: value.toString() } })
                  }
                  min={1}
                  max={1000}
                  disabled={status.is_running}
                />

                <div className='relative'>
                  <div className='absolute left-0 top-0 h-20 w-px bg-border'></div>
                  <div className='pl-8'>
                    <NumberInput
                      label='Период в часах'
                      value={periodHours}
                      onChange={setPeriodHours}
                      min={1}
                      max={168}
                      disabled={status.is_running}
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className='relative'>
                <div className='absolute left-0 top-0 h-20 w-px bg-border'></div>
                <div className='pl-8'>
                  <div className='flex items-start justify-between gap-8'>
                    <div>
                      <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Только топ посты
                      </label>
                    </div>
                    <Switch
                      checked={isTopPosts}
                      onCheckedChange={setIsTopPosts}
                      disabled={status.is_running}
                      className='mt-0.5'
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='relative'>
                <div className='absolute left-0 top-0 h-20 w-px bg-border'></div>
                <div className='pl-8 flex items-center h-20'>
                  <div className='flex items-center gap-3'>
                    <ControlButtons
                      onRun={handleRun}
                      onStop={stopPipeline}
                      isRunning={status.is_running}
                      disabled={!!validationError}
                    />

                    <StatusIndicator
                      isRunning={status.is_running}
                      finished={status.finished}
                      processed={status.processed}
                      total={status.total}
                    />
                  </div>
                </div>
              </div>
            </div>

            {status.total > 0 && (
              <ProgressSection processed={status.processed} total={status.total} />
            )}
            {validationError && (
              <p className='text-red-600 text-sm font-medium'>{validationError}</p>
            )}

            {/* Messages */}
            <MessageAlerts error={error} success={success} />
          </CardContent>
        </Card>

        {/* Saved Posts List */}
        <div className='mt-3'>
          <PostsList />
        </div>
      </div>
    </div>
  );
}

export default App;
