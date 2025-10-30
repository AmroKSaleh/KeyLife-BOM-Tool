// src/components/layout/AppHeader.jsx
import React from 'react';
import UserProfile from '../ui/UserProfile.jsx';

export default function AppHeader({ isAuthenticated, onShowConfig, onShowAuth }) {
    return (
        <header className="py-4 px-6 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Logo and Title */}
                <div className="flex items-center gap-6">
                    <img 
                        src="/src/img/keylife-logo-white.png" 
                        alt="KeyLife Electronics Logo" 
                        className="h-20 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                    <h1 className="text-xl font-bold text-keylife-accent hidden sm:block">
                        BOM Consolidation Tool
                    </h1>
                </div>

                {/* User & Actions */}
                <div className="flex items-center gap-3">
                    {/* Placeholder for Team Name/Context */}
                    <span className="text-gray-500 text-sm hidden lg:inline">
                         R&D Component Library
                         {/* TODO: Replace with dynamic team/context name */}
                    </span>

                    {isAuthenticated ? (
                        <>
                            {/* Settings Button */}
                            <button
                                onClick={onShowConfig}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                                title="Configuration"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="hidden md:inline">Settings</span>
                            </button>
                            <UserProfile />
                        </>
                    ) : (
                        <button
                            onClick={onShowAuth}
                            className="bg-keylife-accent hover:bg-keylife-accent/80 text-white px-4 py-1.5 rounded-lg transition-colors text-sm font-medium"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}