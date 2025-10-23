/**
 * @file useAuth.test.js
 * @description Test suite for useAuth hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '../src/hooks/useAuth.js';
import * as firebase from '../src/config/firebase.js';

// Mock Firebase config
vi.mock('../src/config/firebase.js', () => ({
    signUp: vi.fn(),
    signIn: vi.fn(),
    logOut: vi.fn(),
    resetPassword: vi.fn(),
    getCurrentUser: vi.fn(),
    subscribeToAuthChanges: vi.fn((callback) => {
        setTimeout(() => callback(null), 0);
        return vi.fn();
    })
}));

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should start with loading true and user null', () => {
            const { result } = renderHook(() => useAuth());
            
            expect(result.current.loading).toBe(true);
            expect(result.current.user).toBeNull();
            expect(result.current.error).toBe('');
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should set loading to false after auth state resolves', async () => {
            const { result } = renderHook(() => useAuth());
            
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const mockUser = { uid: 'test-123', email: 'test@example.com', displayName: 'Test User' };
            vi.mocked(firebase.signUp).mockResolvedValueOnce(mockUser);

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.register('test@example.com', 'password123', 'Test User');
            });

            expect(response.success).toBe(true);
            expect(response.user).toEqual(mockUser);
            expect(result.current.error).toBe('');
        });

        it('should handle registration error for existing email', async () => {
            vi.mocked(firebase.signUp).mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.register('existing@example.com', 'password123');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('This email is already registered.');
            expect(result.current.error).toBe('This email is already registered.');
        });

        it('should handle weak password error', async () => {
            vi.mocked(firebase.signUp).mockRejectedValueOnce({ code: 'auth/weak-password' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.register('test@example.com', '123');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Password should be at least 6 characters.');
        });

        it('should handle invalid email error', async () => {
            vi.mocked(firebase.signUp).mockRejectedValueOnce({ code: 'auth/invalid-email' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.register('invalid-email', 'password123');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Invalid email address.');
        });
    });

    describe('login', () => {
        it('should successfully login user', async () => {
            const mockUser = { uid: 'test-123', email: 'test@example.com', displayName: 'Test User' };
            vi.mocked(firebase.signIn).mockResolvedValueOnce(mockUser);

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.login('test@example.com', 'password123');
            });

            expect(response.success).toBe(true);
            expect(response.user).toEqual(mockUser);
            expect(result.current.error).toBe('');
        });

        it('should handle wrong password error', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/wrong-password' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.login('test@example.com', 'wrongpassword');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Incorrect password.');
        });

        it('should handle user not found error', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/user-not-found' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.login('notfound@example.com', 'password123');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('No account found with this email.');
        });

        it('should handle invalid credentials error', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/invalid-credential' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.login('test@example.com', 'wrong');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Invalid email or password.');
        });

        it('should handle network error', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/network-request-failed' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.login('test@example.com', 'password123');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Network error. Please check your connection.');
        });

        it('should handle too many requests error', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/too-many-requests' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.login('test@example.com', 'password123');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Too many failed attempts. Please try again later.');
        });
    });

    describe('logout', () => {
        it('should successfully logout user', async () => {
            vi.mocked(firebase.logOut).mockResolvedValueOnce();

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.logout();
            });

            expect(response.success).toBe(true);
            expect(result.current.user).toBeNull();
        });

        it('should handle logout error', async () => {
            vi.mocked(firebase.logOut).mockRejectedValueOnce({ code: 'auth/network-request-failed' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.logout();
            });

            expect(response.success).toBe(false);
            expect(response.error).toBeTruthy();
        });
    });

    describe('sendPasswordReset', () => {
        it('should successfully send password reset email', async () => {
            vi.mocked(firebase.resetPassword).mockResolvedValueOnce();

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.sendPasswordReset('test@example.com');
            });

            expect(response.success).toBe(true);
            expect(result.current.error).toBe('');
        });

        it('should handle user not found error', async () => {
            vi.mocked(firebase.resetPassword).mockRejectedValueOnce({ code: 'auth/user-not-found' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.sendPasswordReset('notfound@example.com');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('No account found with this email.');
        });

        it('should handle invalid email error', async () => {
            vi.mocked(firebase.resetPassword).mockRejectedValueOnce({ code: 'auth/invalid-email' });

            const { result } = renderHook(() => useAuth());

            let response;
            await act(async () => {
                response = await result.current.sendPasswordReset('invalid-email');
            });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Invalid email address.');
        });
    });

    describe('clearError', () => {
        it('should clear error message', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/wrong-password' });

            const { result } = renderHook(() => useAuth());

            await act(async () => {
                await result.current.login('test@example.com', 'wrong');
            });

            expect(result.current.error).toBeTruthy();

            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBe('');
        });
    });

    describe('isAuthenticated', () => {
        it('should return false when user is null', () => {
            const { result } = renderHook(() => useAuth());
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should return true when user is set', async () => {
            const mockUser = { uid: 'test-123', email: 'test@example.com' };
            vi.mocked(firebase.signIn).mockResolvedValueOnce(mockUser);

            const { result } = renderHook(() => useAuth());

            await act(async () => {
                await result.current.login('test@example.com', 'password123');
            });

            expect(result.current.isAuthenticated).toBe(true);
        });
    });

    describe('Auth State Subscription', () => {
        it('should subscribe to auth changes on mount', () => {
            renderHook(() => useAuth());
            expect(firebase.subscribeToAuthChanges).toHaveBeenCalled();
        });

        it('should unsubscribe on unmount', () => {
            const unsubscribe = vi.fn();
            vi.mocked(firebase.subscribeToAuthChanges).mockReturnValueOnce(unsubscribe);

            const { unmount } = renderHook(() => useAuth());
            unmount();

            expect(unsubscribe).toHaveBeenCalled();
        });
    });
});