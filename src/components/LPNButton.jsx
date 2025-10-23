/**
 * @file LPNButton.jsx
 * @description Button component for assigning Local Part Numbers to components
 */

import { useState } from 'react';
import { useLPN } from '../hooks/useLPN.js';

export default function LPNButton({ component, onSuccess, disabled }) {
    const { assignLPN, isGenerating, hasLPN } = useLPN();
    const [showSuccess, setShowSuccess] = useState(false);
    const [localError, setLocalError] = useState('');

    const componentHasLPN = hasLPN(component);

    const handleAssignLPN = async () => {
        setLocalError('');
        
        const result = await assignLPN(component);
        
        if (result.success) {
            setShowSuccess(true);
            if (onSuccess) {
                onSuccess(result.lpn);
            }
            setTimeout(() => setShowSuccess(false), 3000);
        } else {
            setLocalError(result.error);
            setTimeout(() => setLocalError(''), 5000);
        }
    };

    if (componentHasLPN) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700/50 rounded-lg">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-green-300 font-mono">{component.Local_Part_Number}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={handleAssignLPN}
                disabled={disabled || isGenerating}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-1 px-3 rounded-lg text-xs transition duration-200 inline-flex items-center gap-1"
                title="Assign KeyLife Local Part Number"
            >
                {isGenerating ? (
                    <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Assigning...</span>
                    </>
                ) : showSuccess ? (
                    <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Assigned!</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>Assign KL#</span>
                    </>
                )}
            </button>
            
            {localError && (
                <span className="text-xs text-red-400">{localError}</span>
            )}
        </div>
    );
}