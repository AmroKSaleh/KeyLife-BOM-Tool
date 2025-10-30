/**
 * @file AuthModal.jsx
 * @description Authentication modal with email/password and Google Sign-In
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

export default function AuthModal({ isOpen, onClose }) {
    const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { login, register, loginWithGoogle, sendPasswordReset, loading, error: authError } = useAuth();

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

    const handleGoogleSignIn = async () => {
        setLocalError('');
        const result = await loginWithGoogle();
        if (result.success) {
            handleClose();
        }
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
                    {/* Google Sign-In Button (Login & Register only) */}
                    {mode !== 'reset' && (
                        <>
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-3 border border-gray-300"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
                                </div>
                            </div>
                        </>
                    )}

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