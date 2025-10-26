import React from 'react';
import { Button } from './ui/button';
import { Play, Square } from 'lucide-react';
import PropTypes from 'prop-types';

const ControlButtons = ({ onRun, onStop, isRunning, disabled }) => {
  return (
    <div className='flex gap-2'>
      <Button
        onClick={onRun}
        disabled={isRunning || disabled}
        className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
      >
        <Play className='w-4 h-4 mr-2' />
        Запустить
      </Button>

      <Button
        onClick={onStop}
        disabled={!isRunning}
        variant='destructive'
        className='bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
      >
        <Square className='w-4 h-4 mr-2' />
        Остановить
      </Button>
    </div>
  );
};

ControlButtons.propTypes = {
  onRun: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  isRunning: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};

export { ControlButtons };
