import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

export interface ActivityParams {
  activityId: string | null;
  lang: string;
  currency: string;
  currentStep?: number;
}

export const useActivityParams = (): ActivityParams => {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { currency } = useCurrency();

  const activityId = searchParams.get('activityId');
  const currentStep = searchParams.get('currentStep');
  const lang = searchParams.get('lang') || language;
  const currencyParam = searchParams.get('currency') || currency;

  return {
    activityId,
    lang,
    currency: currencyParam,
    currentStep: currentStep ? parseInt(currentStep, 10) : undefined
  };
};
