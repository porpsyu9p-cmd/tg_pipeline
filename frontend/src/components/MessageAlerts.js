import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const MessageAlerts = ({ error, success }) => {
  if (!error && !success) return null;

  return (
    <div className='space-y-2'>
      {error && (
        <Alert className='border-red-200 bg-red-50'>
          <AlertCircle className='h-4 w-4 text-red-600' />
          <AlertDescription className='text-red-700'>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className='border-green-200 bg-green-50'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-700'>{success}</AlertDescription>
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
