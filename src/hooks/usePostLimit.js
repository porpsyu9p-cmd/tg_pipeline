import { useState, useCallback } from 'react';
import { validatePostLimit } from '../utils/validation';

const usePostLimit = () => {
  const [postLimit, setPostLimit] = useState(100);
  const [validationError, setValidationError] = useState('');

  const handlePostLimitChange = useCallback((event) => {
    const value = parseInt(event.target.value) || 0;
    setPostLimit(value);

    const error = validatePostLimit(value);
    setValidationError(error);
  }, []);

  return {
    postLimit,
    validationError,
    handlePostLimitChange,
  };
};

export { usePostLimit };
