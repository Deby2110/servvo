import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import { queryClient } from './lib/queryClient';
import { SiteProvider } from './features/site/SiteContext';
import { QuoteProvider } from './features/quote/QuoteContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SiteProvider>
            <QuoteProvider>
              <App />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                newestOnTop
                theme="colored"
                toastClassName="font-body text-sm"
              />
            </QuoteProvider>
          </SiteProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);
