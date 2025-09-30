import { NavigateFunction } from 'react-router-dom';

export interface NavigationParams {
  activityId: string | null;
  lang: string;
  currency: string;
  currentStep?: number;
}

export const createActivityUrl = (
  path: string, 
  params: NavigationParams
): string => {
  const url = new URL(path, window.location.origin);
  
  if (params.activityId) {
    url.searchParams.set('activityId', params.activityId);
  }
  url.searchParams.set('lang', params.lang);
  url.searchParams.set('currency', params.currency);
  
  if (params.currentStep !== undefined) {
    url.searchParams.set('currentStep', params.currentStep.toString());
  }
  
  return url.pathname + url.search;
};

export const navigateToActivityStep = (
  navigate: NavigateFunction,
  path: string,
  params: NavigationParams
): void => {
  const url = createActivityUrl(path, params);
  navigate(url);
};
