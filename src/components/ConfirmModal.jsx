/**
 * @file ConfirmModal.jsx
 * @description Reusable confirmation modal component to replace window.confirm()
 */

import { useEffect } from 'react';

export default function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger' // 'danger', 'warning', 'info'
}) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            iconBg: 'bg-red-900/30',
            buttonClass: 'bg-red-600 hover:bg-red-500'
        },
        warning: {
            icon: (
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            iconBg: 'bg-yellow-900/30',
            buttonClass: 'bg-yellow-600 hover:bg-yellow-500'
        },
        info: {
            icon: (
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-blue-900/30',
            buttonClass: 'bg-blue-600 hover:bg-blue-500'
        }
    };

    const currentStyle = typeStyles[type] || typeStyles.danger;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md ring-1 ring-gray-700">
                <div className="p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${currentStyle.iconBg} rounded-full flex items-center justify-center mb-4`}>
                        {currentStyle.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-300 text-sm mb-6">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`px-4 py-2 text-white rounded-lg transition-colors ${currentStyle.buttonClass}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}