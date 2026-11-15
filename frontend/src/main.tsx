import '@utils/bugsnag';
import React from 'react';

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import Bugsnag from '@utils/bugsnag';

const ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary(React);

createRoot(document.getElementById('root')!).render(
  
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
 
);
