import { useState, useEffect, useCallback, useRef } from 'react';
import { pipelineAPI } from '../services/api';
import { API_CONFIG, MESSAGES } from '../constants';

export const usePipeline = () => {
  const [status, setStatus] = useState({
    processed: 0,
    total: 0,
    is_running: false,
    finished: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await pipelineAPI.status();
      setStatus(response.data);
    } catch (err) {
      console.error(MESSAGES.ERROR.STATUS_FETCH, err);
    }
  }, []);

  const runPipeline = useCallback(async (postLimit, periodHours) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await pipelineAPI.run(postLimit, periodHours);
      setSuccess(response.data.message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || MESSAGES.ERROR.PIPELINE_START;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopPipeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await pipelineAPI.stop();
      setSuccess(response.data.message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || MESSAGES.ERROR.PIPELINE_STOP;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(fetchStatus, API_CONFIG.POLLING_INTERVAL);
  }, [fetchStatus]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (error || success) {
      timeoutRef.current = setTimeout(clearMessages, API_CONFIG.MESSAGE_TIMEOUT);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [error, success, clearMessages]);

  useEffect(() => {
    fetchStatus();
    startPolling();

    return () => {
      stopPolling();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchStatus, startPolling, stopPolling]);

  return {
    status,
    isLoading,
    error,
    success,
    fetchStatus,
    runPipeline,
    stopPipeline,
    clearMessages,
  };
};
