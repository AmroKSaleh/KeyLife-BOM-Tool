/**
 * @file useAuth.js
 * @description React hook for managing authentication state
 */

import { useState, useEffect } from 'react';
import { 
    signUp, 
    signIn, 
    logOut, 
    resetPassword,
    signInWithGoogle,
    getCurrentUser,
    subscribeToAuthChanges
} from '../config/firebase.js';
import { useToastContext } from '../context/ToastContext.jsx';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const toast = useToastContext();

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);
    
    /**
     * Register a new user
    */
    const register = async (email, password, displayName) => {
        setError('');
        setLoading(true);
        
        try {
            const userData = await signUp(email, password, displayName);
            setUser(userData);
            return { success: true, user: userData };
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Login existing user
     */
    const login = async (email, password) => {
        setError('');
        setLoading(true);
        
        try {
            const userData = await signIn(email, password);
            setUser(userData);
            return { success: true, user: userData };
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Login with Google
     */
    const loginWithGoogle = async () => {
        setLoading(true);
        setError('');
        try {
            const userData = await signInWithGoogle();
            setUser(userData);
            toast.success(`Welcome, ${userData.displayName}!`);
            return { success: true, user: userData };
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout current user
    */
   const logout = async () => {
       setError('');
       setLoading(true);
       
       try {
            await logOut();
            setUser(null);
            return { success: true };
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send password reset email
     */
    const sendPasswordReset = async (email) => {
        setError('');
        setLoading(true);
        
        try {
            await resetPassword(email);
            return { success: true };
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };


    /**
     * Clear error message
     */
    const clearError = () => {
        setError('');
    };

    return {
        user,
        loading,
        error,
        register,
        login,
        loginWithGoogle,
        logout,
        sendPasswordReset,
        clearError,
        isAuthenticated: !!user
    };
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
function getErrorMessage(error) {
    const errorCode = error.code || error.message;
    
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/operation-not-allowed': 'Operation not allowed. Please contact support.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-closed-by-user': 'Sign-in cancelled.',
        'auth/cancelled-popup-request': 'Only one popup allowed at a time.',
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}