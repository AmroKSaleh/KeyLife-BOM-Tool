/**
 * @file AiModal.jsx
 * @description Enhanced modal for displaying AI-generated component alternatives
 */

import { useEffect } from 'react';

export default function AiModal({ isModalOpen, setIsModalOpen, modalContent, isLoadingAi }) {
    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isModalOpen, setIsModalOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    if (!isModalOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setIsModalOpen(false);
                }
            }}
        >
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl ring-1 ring-keylife-accent/30 w-full max-w-3xl transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-keylife-accent/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-keylife-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">
                                AI-Powered Component Alternatives
                            </h3>
                            <p className="text-sm text-gray-400">
                                Powered by Google Gemini
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoadingAi ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-700"></div>
                                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-keylife-accent absolute top-0"></div>
                            </div>
                            <p className="mt-6 text-lg text-gray-300 font-medium">
                                Searching for alternatives...
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                This may take a few seconds
                            </p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <div 
                                className="text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: modalContent }}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-gray-400 italic">
                            <strong className="text-gray-300">Disclaimer:</strong> AI-generated suggestions should always be verified by a qualified engineer before use in production. Consider electrical specifications, package compatibility, availability, and lifecycle status.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}