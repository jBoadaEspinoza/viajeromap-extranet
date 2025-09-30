import { useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';

export const useExtranetLoading = () => {
  const { startLoading, stopLoading } = useLoading();

  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    operationId: string
  ): Promise<T> => {
    try {
      startLoading(operationId);
      const result = await operation();
      return result;
    } finally {
      stopLoading(operationId);
    }
  }, [startLoading, stopLoading]);

  const startOperation = useCallback((operationId: string) => {
    startLoading(operationId);
  }, [startLoading]);

  const stopOperation = useCallback((operationId: string) => {
    stopLoading(operationId);
  }, [stopLoading]);

  return {
    withLoading,
    startOperation,
    stopOperation
  };
}; 