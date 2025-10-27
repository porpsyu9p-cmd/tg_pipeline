import React from 'react';
import { Button } from './ui/button';
import PropTypes from 'prop-types';

const ControlButtons = ({ onRun, onStop, isRunning, disabled }) => {
  if (isRunning) {
    return (
      <Button onClick={onStop} variant='outline' size='sm' className='border-input'>
        Остановить
      </Button>
    );
  }

  return (
    <Button
      onClick={onRun}
      disabled={disabled}
      size='sm'
      className='bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
    >
      Запустить
    </Button>
  );
};

ControlButtons.propTypes = {
  onRun: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  isRunning: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};

export { ControlButtons };
