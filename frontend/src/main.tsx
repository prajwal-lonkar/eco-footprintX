import '@utils/bugsnag';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import Bugsnag from '@utils/bugsnag';

const reactPlugin = Bugsnag.getPlugin('react');
const ErrorBoundary = reactPlugin
  ? reactPlugin.createErrorBoundary(React)
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);