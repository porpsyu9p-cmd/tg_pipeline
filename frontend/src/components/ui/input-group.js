import * as React from 'react';
import { cn } from '../../lib/utils';

const InputGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        // container mirrors shadcn/ui input-group: fixed height to match inputs/buttons
        'group/input-group relative flex h-9 w-full items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/30 focus-within:ring-offset-0 disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
InputGroup.displayName = 'InputGroup';

const InputGroupAddon = React.forwardRef(({ className, align, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        // match group height; без внутренних горизонтальных отступов
        'flex h-9 items-center whitespace-nowrap',
        align === 'inline-end' ? 'order-1' : '',
        className
      )}
      {...props}
    />
  );
});
InputGroupAddon.displayName = 'InputGroupAddon';

const InputGroupText = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn('flex items-center pl-3 pr-0 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
InputGroupText.displayName = 'InputGroupText';

const InputGroupInput = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // no left padding for tightest spacing after prefix
        'flex h-9 min-w-0 flex-1 bg-transparent pl-0 pr-3 py-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed rounded-none border-0',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
InputGroupInput.displayName = 'InputGroupInput';

export { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput };
