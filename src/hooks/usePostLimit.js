import { useState, useCallback } from 'react';
import { validatePostLimit } from '../utils/validation';

const usePostLimit = () => {
  const [postLimit, setPostLimit] = useState(3);
  const [validationError, setValidationError] = useState('');

  const handlePostLimitChange = useCallback((event) => {
    const value = parseInt(event.target.value) || 0;
    setPostLimit(value);

    const error = validatePostLimit(value);
    setValidationError(error);
  }, []);

  const setPostLimitValue = useCallback((value) => {
    const numeric = parseInt(value) || 0;
    setPostLimit(numeric);
    const error = validatePostLimit(numeric);
    setValidationError(error);
  }, []);

  return {
    postLimit,
    validationError,
    handlePostLimitChange,
    setPostLimitValue,
  };
};

export { usePostLimit };
