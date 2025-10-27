import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

const NumberInput = React.forwardRef(
  (
    {
      className,
      value,
      onChange,
      min = 0,
      max = Infinity,
      step = 1,
      disabled = false,
      label,
      description,
      ...props
    },
    ref
  ) => {
    const handleIncrement = () => {
      const newValue = Math.min(max, (value || 0) + step);
      onChange?.(newValue);
    };

    const handleDecrement = () => {
      const newValue = Math.max(min, (value || 0) - step);
      onChange?.(newValue);
    };

    const handleInputChange = (e) => {
      const newValue = parseInt(e.target.value) || 0;
      if (newValue >= min && newValue <= max) {
        onChange?.(newValue);
      }
    };

    return (
      <div className={cn('space-y-2', className)} ref={ref} {...props}>
        {label && (
          <div className='space-y-1'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              {label}
            </label>
            {description && <p className='text-sm text-muted-foreground'>{description}</p>}
          </div>
        )}

        <div className='flex items-center gap-1'>
          <input
            type='number'
            value={value || ''}
            onChange={handleInputChange}
            min={min}
            max={max}
            disabled={disabled}
            className='flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center shadow-xs transition-[color,box-shadow] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]'
          />

          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 w-8 p-0'
            onClick={handleDecrement}
            disabled={disabled || value <= min}
          >
            −
          </Button>

          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 w-8 p-0'
            onClick={handleIncrement}
            disabled={disabled || value >= max}
          >
            +
          </Button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
