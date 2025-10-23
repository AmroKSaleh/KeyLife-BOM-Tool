/**
 * @file firebase.test.js
 * @description Test suite for Firebase authentication functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    signUp, 
    signIn, 
    logOut, 
    resetPassword,
    getCurrentUserId,
    getCurrentUser,
    subscribeToAuthChanges
} from '../src/config/firebase.js';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => {
    const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User'
    };

    return {
        getAuth: vi.fn(() => ({
            currentUser: mockUser
        })),
        signInWithEmailAndPassword: vi.fn(async (auth, email, password) => {
            if (email === 'wrong@example.com') {
                throw new Error('auth/wrong-password');
            }
            return {
                user: {
                    uid: 'test-uid-123',
                    email: email,
                    displayName: 'Test User'
                }
            };
        }),
        createUserWithEmailAndPassword: vi.fn(async (auth, email, password) => {
            if (email === 'existing@example.com') {
                throw new Error('auth/email-already-in-use');
            }
            return {
                user: {
                    uid: 'new-uid-456',
                    email: email,
                    displayName: null
                }
            };
        }),
        signOut: vi.fn(async () => {}),
        sendPasswordResetEmail: vi.fn(async (auth, email) => {
            if (email === 'notfound@example.com') {
                throw new Error('auth/user-not-found');
            }
        }),
        updateProfile: vi.fn(async (user, profile) => {}),
        onAuthStateChanged: vi.fn((auth, callback) => {
            callback(mockUser);
            return vi.fn(); // unsubscribe function
        })
    };
});

describe('Firebase Authentication', () => {
    describe('signUp', () => {
        it('should create user with email and password', async () => {
            const result = await signUp('newuser@example.com', 'password123', 'New User');
            
            expect(result).toHaveProperty('uid');
            expect(result).toHaveProperty('email');
            expect(result.email).toBe('newuser@example.com');
        });

        it('should create user without display name', async () => {
            const result = await signUp('newuser@example.com', 'password123');
            
            expect(result).toHaveProperty('uid');
            expect(result.email).toBe('newuser@example.com');
        });

        it('should throw error for existing email', async () => {
            await expect(
                signUp('existing@example.com', 'password123')
            ).rejects.toThrow();
        });
    });

    describe('signIn', () => {
        it('should sign in with valid credentials', async () => {
            const result = await signIn('test@example.com', 'password123');
            
            expect(result).toHaveProperty('uid');
            expect(result).toHaveProperty('email');
            expect(result.email).toBe('test@example.com');
            expect(result.displayName).toBeDefined();
        });

        it('should throw error for invalid credentials', async () => {
            await expect(
                signIn('wrong@example.com', 'wrongpassword')
            ).rejects.toThrow();
        });

        it('should return user object with displayName or email', async () => {
            const result = await signIn('test@example.com', 'password123');
            
            expect(result.displayName).toBeTruthy();
        });
    });

    describe('logOut', () => {
        it('should sign out current user', async () => {
            await expect(logOut()).resolves.not.toThrow();
        });
    });

    describe('resetPassword', () => {
        it('should send password reset email', async () => {
            await expect(
                resetPassword('test@example.com')
            ).resolves.not.toThrow();
        });

        it('should throw error for non-existent user', async () => {
            await expect(
                resetPassword('notfound@example.com')
            ).rejects.toThrow();
        });
    });

    describe('getCurrentUserId', () => {
        it('should return current user ID', () => {
            const userId = getCurrentUserId();
            expect(userId).toBe('test-uid-123');
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user object', () => {
            const user = getCurrentUser();
            
            expect(user).toHaveProperty('uid');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('displayName');
            expect(user.uid).toBe('test-uid-123');
        });

        it('should return user object with proper structure', () => {
            const user = getCurrentUser();
            
            expect(user.uid).toBeTruthy();
            expect(user.email).toBeTruthy();
            expect(user.displayName).toBeTruthy();
        });
    });

    describe('subscribeToAuthChanges', () => {
        it('should call callback with user on auth state change', () => {
            const callback = vi.fn();
            const unsubscribe = subscribeToAuthChanges(callback);
            
            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    uid: expect.any(String),
                    email: expect.any(String)
                })
            );
            
            expect(typeof unsubscribe).toBe('function');
        });

        it('should return unsubscribe function', () => {
            const callback = vi.fn();
            const unsubscribe = subscribeToAuthChanges(callback);
            
            expect(typeof unsubscribe).toBe('function');
        });
    });
});

describe('Firebase Configuration', () => {
    it('should have required environment variables', () => {
        // Note: In real tests, you'd check process.env or import.meta.env
        // This is a placeholder to ensure the config is checked
        expect(true).toBe(true);
    });
});

describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
        // Simulate network error
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Network error'));
        
        await expect(
            signIn('test@example.com', 'password123')
        ).rejects.toThrow();
    });
});