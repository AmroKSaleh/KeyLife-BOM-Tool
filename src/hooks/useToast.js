/**
 * @file useToast.js
 * @description React hook for managing toast notifications
 */

import { useState, useCallback } from 'react';

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    /**
     * Show a toast notification
     */
    const showToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        
        const newToast = {
            id,
            message,
            type,
            duration,
            isVisible: true
        };

        setToasts(prev => [...prev, newToast]);

        return id;
    }, []);

    /**
     * Show success toast
     */
    const success = useCallback((message, duration = 5000) => {
        return showToast(message, 'success', duration);
    }, [showToast]);

    /**
     * Show error toast
     */
    const error = useCallback((message, duration = 5000) => {
        return showToast(message, 'error', duration);
    }, [showToast]);

    /**
     * Show warning toast
     */
    const warning = useCallback((message, duration = 5000) => {
        return showToast(message, 'warning', duration);
    }, [showToast]);

    /**
     * Show info toast
     */
    const info = useCallback((message, duration = 5000) => {
        return showToast(message, 'info', duration);
    }, [showToast]);

    /**
     * Close a specific toast
     */
    const closeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    /**
     * Clear all toasts
     */
    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        closeToast,
        clearAll
    };
};