/**
 * @file main.jsx
 * @description Application entry point with providers
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastProvider } from './context/ToastContext.jsx';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <ToastProvider>
                <App />
            </ToastProvider>
        </ErrorBoundary>
    </React.StrictMode>
);