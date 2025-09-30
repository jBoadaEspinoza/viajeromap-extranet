import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

interface UrlParamsSyncProps {
  children: React.ReactNode;
}

const UrlParamsSync: React.FC<UrlParamsSyncProps> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  // Sync URL parameters with context on mount
  useEffect(() => {
    const urlLang = searchParams.get('lang') as 'es' | 'en';
    const urlCurrency = searchParams.get('currency')?.toUpperCase() as 'PEN' | 'USD';

    // Update language if URL parameter is valid and different
    if (urlLang && (urlLang === 'es' || urlLang === 'en') && urlLang !== language) {
      setLanguage(urlLang);
    }

    // Update currency if URL parameter is valid and different
    if (urlCurrency && (urlCurrency === 'PEN' || urlCurrency === 'USD') && urlCurrency !== currency) {
      setCurrency(urlCurrency);
    }
  }, []); // Only run on mount

  // Update URL when context changes
  useEffect(() => {
    const currentLang = searchParams.get('lang');
    const currentCurrency = searchParams.get('currency');

    if (currentLang !== language || currentCurrency !== currency.toLowerCase()) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('lang', language);
      newParams.set('currency', currency.toLowerCase());
      setSearchParams(newParams);
    }
  }, [language, currency, searchParams, setSearchParams]);

  return <>{children}</>;
};

export default UrlParamsSync; 