import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current URL parameters
  const getLang = (): string => searchParams.get('lang') || 'es';
  const getCurrency = (): string => searchParams.get('currency') || 'usd';

  // Update URL parameters
  const updateLang = useCallback((lang: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('lang', lang);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const updateCurrency = useCallback((currency: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('currency', currency);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Update both parameters at once
  const updateParams = useCallback((lang: string, currency: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('lang', lang);
    newParams.set('currency', currency);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  return {
    lang: getLang(),
    currency: getCurrency(),
    updateLang,
    updateCurrency,
    updateParams
  };
}; 