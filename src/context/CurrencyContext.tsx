import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Currency = 'PEN' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  getCurrencySymbol: (currency: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // Get currency from localStorage or default to USD
  const getInitialCurrency = (): Currency => {
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && (savedCurrency === 'PEN' || savedCurrency === 'USD')) {
      return savedCurrency;
    }
    return 'USD';
  };

  const [currency, setCurrency] = useState<Currency>(getInitialCurrency);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const getCurrencySymbol = (curr: Currency) => {
    return curr === 'PEN' ? 'S/' : '$';
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency: handleSetCurrency,
      getCurrencySymbol 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 