import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const MessageAlerts = ({ error, success }) => {
  if (!error && !success) return null;

  return (
    <div className='space-y-2'>
      {error && (
        <Alert className='border-red-500/50 bg-red-500/10'>
          <AlertCircle className='h-4 w-4 text-red-400' />
          <AlertDescription className='text-red-300'>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className='border-green-500/50 bg-green-500/10'>
          <CheckCircle className='h-4 w-4 text-green-400' />
          <AlertDescription className='text-green-300'>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

MessageAlerts.propTypes = {
  error: PropTypes.string,
  success: PropTypes.string,
};

export { MessageAlerts };
