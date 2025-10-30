/**
 * @file main.jsx
 * @description Application entry point with providers
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

// TODO: Install material-symbols font package and material web components
// import 'material-symbols/outlined.css'; // Font import placeholder
import '@material/web/all.js';

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