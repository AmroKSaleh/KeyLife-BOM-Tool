/**
 * @file UserProfile.jsx
 * @description User profile display and logout component
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

export default function UserProfile() {
    const { user, logout, isAuthenticated } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (!isAuthenticated || !user) {
        return null;
    }

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
        setIsDropdownOpen(false);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="relative">
            {/* Profile Button */}
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title={user.email}
            >
                <div className="w-8 h-8 bg-keylife-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(user.displayName)}
                </div>
                <span className="hidden md:inline text-sm text-white">
                    {user.displayName}
                </span>
                <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setIsDropdownOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20">
                        {/* User Info */}
                        <div className="p-4 border-b border-gray-700">
                            <p className="text-sm font-medium text-white">
                                {user.displayName}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 truncate">
                                {user.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                User ID: {user.uid}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                        <span className="text-sm">Signing out...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="text-sm">Sign Out</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}