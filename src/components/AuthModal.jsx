/**
 * @file AuthModal.jsx
 * @description Authentication modal for login, register, and password reset
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

export default function AuthModal({ isOpen, onClose }) {
    const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { login, register, sendPasswordReset, loading, error: authError } = useAuth();

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setDisplayName('');
        setConfirmPassword('');
        setLocalError('');
        setSuccessMessage('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setLocalError('Passwords do not match');
                return;
            }
            if (password.length < 6) {
                setLocalError('Password must be at least 6 characters');
                return;
            }

            const result = await register(email, password, displayName);
            if (result.success) {
                handleClose();
            }
        } else if (mode === 'login') {
            const result = await login(email, password);
            if (result.success) {
                handleClose();
            }
        } else if (mode === 'reset') {
            const result = await sendPasswordReset(email);
            if (result.success) {
                setSuccessMessage('Password reset email sent! Check your inbox.');
                setTimeout(() => {
                    setMode('login');
                    resetForm();
                }, 3000);
            }
        }
    };

    const switchMode = (newMode) => {
        resetForm();
        setMode(newMode);
    };

    if (!isOpen) return null;

    const displayError = localError || authError;

    return (
        <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md ring-1 ring-keylife-accent/30">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {mode === 'login' && 'Welcome Back'}
                            {mode === 'register' && 'Create Account'}
                            {mode === 'reset' && 'Reset Password'}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {mode === 'login' && 'Sign in to access your BOM library'}
                            {mode === 'register' && 'Join KeyLife Electronics BOM Tool'}
                            {mode === 'reset' && 'Enter your email to receive reset instructions'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Display Name (Register only) */}
                    {mode === 'register' && (
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keylife-accent focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keylife-accent focus:border-transparent"
                        />
                    </div>

                    {/* Password (Login & Register) */}
                    {mode !== 'reset' && (
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keylife-accent focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Confirm Password (Register only) */}
                    {mode === 'register' && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keylife-accent focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {displayError && (
                        <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {displayError}
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-900/30 border border-green-700/50 text-green-300 px-4 py-3 rounded-lg text-sm">
                            {successMessage}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-keylife-accent hover:bg-keylife-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                {mode === 'login' && 'Sign In'}
                                {mode === 'register' && 'Create Account'}
                                {mode === 'reset' && 'Send Reset Email'}
                            </>
                        )}
                    </button>

                    {/* Mode Switchers */}
                    <div className="text-center text-sm space-y-2">
                        {mode === 'login' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => switchMode('reset')}
                                    className="text-keylife-accent hover:text-keylife-accent/80 block w-full"
                                >
                                    Forgot password?
                                </button>
                                <div className="text-gray-400">
                                    Don't have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => switchMode('register')}
                                        className="text-keylife-accent hover:text-keylife-accent/80"
                                    >
                                        Sign up
                                    </button>
                                </div>
                            </>
                        )}

                        {mode === 'register' && (
                            <div className="text-gray-400">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className="text-keylife-accent hover:text-keylife-accent/80"
                                >
                                    Sign in
                                </button>
                            </div>
                        )}

                        {mode === 'reset' && (
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className="text-keylife-accent hover:text-keylife-accent/80"
                            >
                                Back to login
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}