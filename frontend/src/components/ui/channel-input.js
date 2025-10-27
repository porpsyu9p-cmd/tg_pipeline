import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Check } from 'lucide-react';

const ChannelInput = React.forwardRef(
  (
    {
      className,
      value,
      onChange,
      onSave,
      onUnsave,
      isSaved = false,
      disabled = false,
      placeholder = 'канал',
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState(value || '');
    const [isModified, setIsModified] = React.useState(false);

    React.useEffect(() => {
      setInputValue(value || '');
      setIsModified(false);
    }, [value]);

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsModified(newValue !== value);
      onChange?.(newValue);
    };

    const handleButtonClick = () => {
      // Проверяем, что поле не пустое
      if (!inputValue.trim()) {
        return;
      }

      if (isSaved && !isModified) {
        // Если канал сохранен и нет изменений - отжимаем (удаляем из сохраненных)
        onUnsave?.(inputValue);
      } else {
        // Если канал не сохранен или есть изменения - сохраняем
        onSave?.(inputValue);
        setIsModified(false);
      }
    };

    const buttonVariant = isSaved && !isModified ? 'default' : 'secondary';
    const isButtonDisabled = disabled || !inputValue.trim();

    return (
      <div className={cn('relative', className)} ref={ref} {...props}>
        <div className='flex w-full items-center rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/30 focus-within:ring-offset-0'>
          {/* Статичный префикс @ */}
          <div className='flex items-center pl-3 text-sm text-muted-foreground'>@</div>

          <input
            type='text'
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className='flex h-9 flex-1 bg-transparent pl-1 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          />

          <div className='flex items-center pr-1'>
            <Button
              type='button'
              variant={buttonVariant}
              size='sm'
              className='h-6 w-6 p-0 rounded-full'
              onClick={handleButtonClick}
              disabled={isButtonDisabled}
            >
              <Check className='h-3 w-3' />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ChannelInput.displayName = 'ChannelInput';

export { ChannelInput };
