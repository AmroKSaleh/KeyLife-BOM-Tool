/**
 * @file useAuth.test.jsx
 * @description Test suite for useAuth hook (renamed to .jsx due to JSX usage)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '../src/hooks/useAuth.js';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import * as firebase from '../src/config/firebase.js';

// --- Wrapper Component ---
const AllTheProviders = ({ children }) => <ToastProvider>{children}</ToastProvider>;

// --- Mock Firebase config ---
let authStateCallback = null;
const mockUnsubscribe = vi.fn();

vi.mock('../src/config/firebase.js', () => ({
    signUp: vi.fn(), signIn: vi.fn(), logOut: vi.fn(), resetPassword: vi.fn(),
    signInWithGoogle: vi.fn(), getCurrentUser: vi.fn(),
    subscribeToAuthChanges: vi.fn((callback) => {
        authStateCallback = callback;
        // Use queueMicrotask to simulate async callback after initial render
        queueMicrotask(() => { if (authStateCallback) authStateCallback(null); });
        return mockUnsubscribe;
    })
}));


describe('useAuth', () => {
    let firebaseAuthMocks;

    beforeEach(async () => {
        vi.clearAllMocks();
        authStateCallback = null;
        // It's generally safer to await dynamic imports if mocks depend on them,
        // but Vitest often handles this. Keeping await for clarity.
        firebaseAuthMocks = await import('firebase/auth');

        // Reset subscribe mock implementation
        vi.mocked(firebase.subscribeToAuthChanges).mockImplementation((callback) => {
             authStateCallback = callback;
             // Use queueMicrotask again for initial async call
             queueMicrotask(() => { if (authStateCallback) authStateCallback(null); });
             return mockUnsubscribe;
        });

        // Reset other mocks
        vi.mocked(firebase.logOut).mockReset();
        vi.mocked(firebase.signIn).mockReset();
        vi.mocked(firebase.signUp).mockReset();
        vi.mocked(firebase.signInWithGoogle).mockReset();
        vi.mocked(firebase.resetPassword).mockReset();
    });

    // Helper to render the hook
    const renderAuthHook = () => renderHook(() => useAuth(), { wrapper: AllTheProviders });

    describe('Initial State', () => {
        it('should start with loading true and resolve to user null', async () => {
            const { result } = renderAuthHook();

            // 1. Assert initial loading state immediately after render
            expect(result.current.loading).toBe(true);

            // 2. Explicitly wait only for the loading state to become false.
            //    waitFor uses act internally, handling the async update from queueMicrotask.
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // 3. Assert final state after loading has resolved
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.error).toBe('');
        });
        // Removed the separate "set loading to false" test as it's covered above
    });

    describe('register', () => {
        it('should successfully register and update user state', async () => {
            const mockUser = { uid: 'reg-1', email:'r@r.com', displayName: 'Reg' };
            vi.mocked(firebase.signUp).mockResolvedValueOnce(mockUser);
            const { result } = renderAuthHook();
            // Wait for initial async loading to finish before interacting
            await waitFor(() => expect(result.current.loading).toBe(false));

            let response;
            await act(async () => {
                 response = await result.current.register('r@r.com', 'pass', 'Reg');
                 // Simulate async auth state change after registration success
                 if (authStateCallback) authStateCallback(mockUser);
            });

            expect(response.success).toBe(true);
            expect(response.user).toEqual(mockUser);
            // Wait for the hook state to reflect the change from the callback
            await waitFor(() => expect(result.current.user).toEqual(mockUser));
            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.error).toBe('');
        });
        it('should handle registration error for existing email', async () => {
             vi.mocked(firebase.signUp).mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
             const { result } = renderAuthHook();
             await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.register('e@e.com','p')});
             expect(res.success).toBe(false); expect(res.error).contain('already registered'); expect(result.current.error).contain('already registered');
        });
        it('should handle weak password error', async () => {
             vi.mocked(firebase.signUp).mockRejectedValueOnce({ code: 'auth/weak-password' });
             const { result } = renderAuthHook();
             await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.register('w@w.com','123')});
             expect(res.success).toBe(false); expect(res.error).contain('at least 6 characters'); expect(result.current.error).contain('at least 6 characters');
        });
        it('should handle invalid email error', async () => {
            vi.mocked(firebase.signUp).mockRejectedValueOnce({ code: 'auth/invalid-email' });
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
            let res; await act(async () => {res = await result.current.register('invalid','p')});
            expect(res.success).toBe(false); expect(res.error).contain('Invalid email'); expect(result.current.error).contain('Invalid email');
        });
        it('should handle Google Sign-In', async () => {
             const user = { uid: 'g1' }; vi.mocked(firebase.signInWithGoogle).mockResolvedValueOnce(user);
             const { result } = renderAuthHook();
             await waitFor(() => expect(result.current.loading).toBe(false));
             let res;
             await act(async () => {
                 res = await result.current.loginWithGoogle();
                 if (authStateCallback) authStateCallback(user);
             });
             expect(res.success).toBe(true); expect(res.user).toEqual(user);
             await waitFor(() => expect(result.current.user).toEqual(user));
         });
         it('should handle Google Sign-In failure', async () => {
            vi.mocked(firebase.signInWithGoogle).mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.loginWithGoogle()});
            expect(res.success).toBe(false); expect(res.error).contain('cancelled'); expect(result.current.error).contain('cancelled');
        });
    });

    describe('login', () => {
        it('should successfully login and update user state', async () => {
            const mockUser = { uid: 'log-1', email:'l@l.com', displayName: 'Log' };
            vi.mocked(firebase.signIn).mockResolvedValueOnce(mockUser);
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));

            let response;
            await act(async () => {
                 response = await result.current.login('l@l.com', 'pass');
                 if (authStateCallback) authStateCallback(mockUser);
            });

            expect(response.success).toBe(true);
            expect(response.user).toEqual(mockUser);
            await waitFor(() => expect(result.current.user).toEqual(mockUser));
            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.error).toBe('');
        });
        it('should handle wrong password error', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/wrong-password' });
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.login('l@l.com','w')});
            expect(res.success).toBe(false); expect(res.error).contain('Incorrect password'); expect(result.current.error).contain('Incorrect password');
        });
        it('should handle user not found error', async () => {
             vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/user-not-found' });
             const { result } = renderAuthHook();
             await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.login('nf@nf.com','p')});
             expect(res.success).toBe(false); expect(res.error).contain('No account found'); expect(result.current.error).contain('No account found');
        });
        it('should handle invalid credentials error', async () => {
             vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/invalid-credential' });
             const { result } = renderAuthHook();
             await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.login('ic@ic.com','p')});
             expect(res.success).toBe(false); expect(res.error).contain('Invalid email or password'); expect(result.current.error).contain('Invalid email or password');
        });
        it('should handle network error', async () => {
             vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/network-request-failed' });
             const { result } = renderAuthHook();
             await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.login('nw@nw.com','p')});
             expect(res.success).toBe(false); expect(res.error).contain('Network error'); expect(result.current.error).contain('Network error');
        });
        it('should handle too many requests error', async () => {
             vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/too-many-requests' });
             const { result } = renderAuthHook();
             await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async () => {res = await result.current.login('tmr@tmr.com','p')});
             expect(res.success).toBe(false); expect(res.error).contain('Too many failed attempts'); expect(result.current.error).contain('Too many failed attempts');
        });
    });

    describe('logout', () => {
        it('should successfully logout user', async () => {
            vi.mocked(firebase.logOut).mockResolvedValueOnce();
            const mockUser = { uid: 'logout-s' };
            const { result } = renderAuthHook();
            // Wait for initial load
            await waitFor(() => expect(result.current.loading).toBe(false));

            // Simulate initial login via state change callback and wait for it
            await act(async () => { if (authStateCallback) authStateCallback(mockUser); });
            await waitFor(() => expect(result.current.user).toEqual(mockUser));

            let response;
            await act(async () => {
                response = await result.current.logout();
                // Simulate async state change after logout success
                if (authStateCallback) authStateCallback(null);
            });

            expect(response.success).toBe(true);
            // Wait specifically for user state to become null
            await waitFor(() => expect(result.current.user).toBeNull());
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.error).toBe('');
        });

        it('should handle logout error', async () => {
            const logoutError = { code: 'auth/network-request-failed', message: 'NW Err' };
            vi.mocked(firebase.logOut).mockRejectedValueOnce(logoutError);
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
            // Optional: simulate logged in first
            await act(async () => { if (authStateCallback) authStateCallback({ uid: 'logout-fail' }); });
            await waitFor(() => expect(result.current.user).not.toBeNull());

            let response;
            await act(async () => { response = await result.current.logout(); });

            expect(response.success).toBe(false);
            expect(response.error).toBe('Network error. Please check your connection.');
            expect(result.current.error).toBe('Network error. Please check your connection.');
        });
    });

    describe('sendPasswordReset', () => {
        it('should successfully send password reset email', async () => {
            vi.mocked(firebase.resetPassword).mockResolvedValueOnce();
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async()=>{res=await result.current.sendPasswordReset('p@p.com')});
            expect(res.success).toBe(true); expect(result.current.error).toBe('');
        });
        it('should handle user not found error', async () => {
            vi.mocked(firebase.resetPassword).mockRejectedValueOnce({ code: 'auth/user-not-found' });
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async()=>{res=await result.current.sendPasswordReset('nf@nf.com')});
            expect(res.success).toBe(false); expect(res.error).contain('No account found'); expect(result.current.error).contain('No account found');
        });
        it('should handle invalid email error', async () => {
            vi.mocked(firebase.resetPassword).mockRejectedValueOnce({ code: 'auth/invalid-email' });
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
             let res; await act(async()=>{res=await result.current.sendPasswordReset('inv')});
            expect(res.success).toBe(false); expect(res.error).contain('Invalid email'); expect(result.current.error).contain('Invalid email');
        });
    });

    describe('clearError', () => {
        it('should clear error message', async () => {
            vi.mocked(firebase.signIn).mockRejectedValueOnce({ code: 'auth/wrong-password' });
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
            await act(async () => { await result.current.login('t@t.com', 'w'); });
            expect(result.current.error).not.toBe('');
            act(() => { result.current.clearError(); });
            expect(result.current.error).toBe('');
        });
    });

    describe('isAuthenticated', () => {
        it('should return false when user is null', async () => {
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.isAuthenticated).toBe(false);
        });
        it('should return true when user is set', async () => {
            const user = { uid: 'auth' };
            const { result } = renderAuthHook();
            await waitFor(() => expect(result.current.loading).toBe(false)); // Wait for initial load
            // Simulate login
            await act(async () => { if (authStateCallback) authStateCallback(user); });
            // Wait for state update and assert
            await waitFor(() => {
                expect(result.current.user).toEqual(user);
                expect(result.current.isAuthenticated).toBe(true);
            });
        });
    });

    describe('Auth State Subscription', () => {
        it('should subscribe to auth changes on mount', () => {
             renderAuthHook();
             // Expect subscribe to be called once upon mounting
             expect(firebase.subscribeToAuthChanges).toHaveBeenCalledTimes(1);
         });

         it('should unsubscribe on unmount', () => {
             const { unmount } = renderAuthHook();
             unmount();
             // Expect the mock unsubscribe function to have been called
             expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
         });
    });

});
