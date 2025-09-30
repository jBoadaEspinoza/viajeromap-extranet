import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider } from './context/AuthContext';
import ConditionalLayout from './components/ConditionalLayout';
import UrlParamsSync from './components/UrlParamsSync';
import AppRoutes from './routes/AppRoutes';

import { updateAppColors } from './utils/configUtils';

function App() {
  useEffect(() => {
    updateAppColors();
  }, []);

  return (
    <Provider store={store}>
      <ConfigProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <Router>
                <UrlParamsSync>
                  <ConditionalLayout>
                    <AppRoutes />
                  </ConditionalLayout>
                </UrlParamsSync>
              </Router>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
