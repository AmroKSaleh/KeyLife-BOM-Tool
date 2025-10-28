/**
 * @file ToastContext.jsx
 * @description Context provider for global toast notifications
 */

import { createContext, useContext } from 'react';
import { useToast } from '../hooks/useToast.js';
import ToastContainer from '../components/ToastContainer.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const toast = useToast();

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within ToastProvider');
    }
    return context;
}