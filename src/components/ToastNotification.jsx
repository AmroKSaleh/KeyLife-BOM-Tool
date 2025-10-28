/**
 * @file ToastNotification.jsx
 * @description Toast notification component for displaying temporary messages
 */

import { useEffect } from 'react';

export default function ToastNotification({ 
    message, 
    type = 'info', // 'success', 'error', 'warning', 'info'
    isVisible,
    onClose,
    duration = 5000,
    position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'
}) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const typeStyles = {
        success: {
            bg: 'bg-green-900/90',
            border: 'border-green-700',
            text: 'text-green-300',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )
        },
        error: {
            bg: 'bg-red-900/90',
            border: 'border-red-700',
            text: 'text-red-300',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )
        },
        warning: {
            bg: 'bg-yellow-900/90',
            border: 'border-yellow-700',
            text: 'text-yellow-300',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            )
        },
        info: {
            bg: 'bg-blue-900/90',
            border: 'border-blue-700',
            text: 'text-blue-300',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            )
        }
    };

    const positionStyles = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
    };

    const currentStyle = typeStyles[type] || typeStyles.info;
    const currentPosition = positionStyles[position] || positionStyles['top-right'];

    return (
        <div 
            className={`fixed ${currentPosition} z-50 animate-slide-in-right`}
            role="alert"
        >
            <div 
                className={`${currentStyle.bg} ${currentStyle.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md backdrop-blur-sm`}
            >
                <div className="flex items-start gap-3">
                    <div className={`${currentStyle.text} flex-shrink-0`}>
                        {currentStyle.icon}
                    </div>
                    
                    <div className={`${currentStyle.text} flex-1 text-sm`}>
                        {message}
                    </div>

                    <button
                        onClick={onClose}
                        className={`${currentStyle.text} hover:text-white transition-colors flex-shrink-0`}
                        aria-label="Close notification"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Progress bar for auto-dismiss */}
                {duration > 0 && (
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white/50 rounded-full transition-all ease-linear"
                            style={{
                                animation: `shrink ${duration}ms linear forwards`
                            }}
                        />
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}