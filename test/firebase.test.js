/**
 * @file firebase.test.js
 * @description Test suite for Firebase authentication functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    signUp,
    signIn,
    logOut,
    resetPassword,
    signInWithGoogle,
    getCurrentUserId,
    getCurrentUser,
    subscribeToAuthChanges
} from '../src/config/firebase.js';

// --- Mock Firebase Modules ---
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/firestore', () => ({ getFirestore: vi.fn(() => ({})) }));

// --- Variables to manage mock state ---
let mockCurrentUser = null;
let authStateListeners = [];
const createMockUser = (uid, email, displayName) => ({ /* ... unchanged helper ... */
    uid: uid || `test-uid-${Math.random().toString(16).slice(2)}`,
    email: email || 'test@example.com',
    displayName: displayName || 'Test User'
});
const triggerAuthStateChange = (user) => { /* ... unchanged helper ... */
    mockCurrentUser = user;
    [...authStateListeners].forEach(cb => cb(mockCurrentUser));
};

// --- Updated Mock for firebase/auth ---
vi.mock('firebase/auth', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        getAuth: vi.fn(() => ({
            get currentUser() { return mockCurrentUser; }
        })),
        GoogleAuthProvider: vi.fn(() => ({})),
        signInWithPopup: vi.fn(async (auth, provider) => { /* ... unchanged ... */
            const user = createMockUser('google-uid', 'google@example.com', 'Google User');
            triggerAuthStateChange(user); return { user };
        }),
        signInWithEmailAndPassword: vi.fn(async (auth, email, password) => { /* ... unchanged ... */
            if (email === 'wrong@example.com' || password === 'wrongpassword') throw { code: 'auth/invalid-credential' };
            if (email === 'notfound@example.com') throw { code: 'auth/user-not-found' };
            const user = createMockUser(null, email, 'Logged In User');
            triggerAuthStateChange(user); return { user };
        }),
        createUserWithEmailAndPassword: vi.fn(async (auth, email, password) => { /* ... unchanged ... */
            if (email === 'existing@example.com') throw { code: 'auth/email-already-in-use' };
            if (password.length < 6) throw { code: 'auth/weak-password' };
            const user = createMockUser(null, email, null);
            triggerAuthStateChange(user); return { user };
        }),
        signOut: vi.fn(async () => { triggerAuthStateChange(null); }),
        sendPasswordResetEmail: vi.fn(async (auth, email) => { /* ... unchanged ... */
            if (email === 'notfound@example.com') throw { code: 'auth/user-not-found' };
        }),
        updateProfile: vi.fn(async (user, profile) => { /* ... unchanged ... */
             if (mockCurrentUser && mockCurrentUser.uid === user.uid) mockCurrentUser.displayName = profile.displayName;
        }),
        // --- Adjusted onAuthStateChanged ---
        onAuthStateChanged: vi.fn((auth, callback) => {
            authStateListeners.push(callback);
            // Immediately call with the CURRENT mock state, reflecting beforeEach setup
            callback(mockCurrentUser);
            // Return unsubscribe function
            return () => {
                authStateListeners = authStateListeners.filter(cb => cb !== callback);
            };
        })
    };
});


describe('Firebase Authentication', () => {

    let firebaseAuthMocks;
    beforeEach(async () => {
        vi.clearAllMocks();
        mockCurrentUser = null; // Ensure starts null
        authStateListeners = [];
        firebaseAuthMocks = await import('firebase/auth');
        // Set the desired initial state for most tests AFTER resetting
        mockCurrentUser = createMockUser('initial-uid', 'initial@example.com', 'Initial User');
    });

    // --- SignUp Tests ---
    describe('signUp', () => {
        it('should create user and call updateProfile if displayName provided', async () => { /* ... */ });
        it('should create user and NOT call updateProfile if no displayName', async () => { /* ... */ });
        it('should reject for existing email', async () => { /* ... */ });
        it('should reject for weak password', async () => { /* ... */ });
    });

    // --- SignIn Tests ---
    describe('signIn', () => {
        it('should sign in with valid credentials', async () => { /* ... */ });
        it('should reject for invalid credentials', async () => { /* ... */ });
        it('should reject for user not found', async () => { /* ... */ });
    });

    // --- SignInWithGoogle Tests ---
    describe('signInWithGoogle', () => {
        it('should sign in with Google popup', async () => { /* ... */ });
        it('should reject if Google sign in fails', async () => { /* ... */ });
    });

    // --- logOut Test ---
    describe('logOut', () => {
        it('should call signOut', async () => { /* ... */ });
    });

    // --- resetPassword Tests ---
    describe('resetPassword', () => {
        it('should call sendPasswordResetEmail', async () => { /* ... */ });
        it('should reject for non-existent user', async () => { /* ... */ });
    });

    // --- Corrected getCurrentUserId/getCurrentUser Tests ---
    describe('getCurrentUserId', () => {
        it('should return current user ID if logged in', () => {
             // beforeEach sets mockCurrentUser
             expect(getCurrentUserId()).toBe('initial-uid');
        });
        it('should return null if not logged in', async () => {
             // Explicitly set to logged out for this test
             triggerAuthStateChange(null);
             expect(getCurrentUserId()).toBeNull();
         });
    });

    describe('getCurrentUser', () => {
        it('should return current user object if logged in', () => {
             // beforeEach sets mockCurrentUser
            expect(getCurrentUser()).toEqual(expect.objectContaining({ uid: 'initial-uid' }));
        });
         it('should return null if not logged in', async () => {
             // Explicitly set to logged out for this test
             triggerAuthStateChange(null);
             expect(getCurrentUser()).toBeNull();
         });
    });

    // --- Corrected subscribeToAuthChanges Test ---
    describe('subscribeToAuthChanges', () => {
        it('should call callback immediately and on change', () => {
            const callback = vi.fn();
            // User is set in beforeEach
            const unsubscribe = subscribeToAuthChanges(callback);

            // Called immediately with the user set in beforeEach
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({ uid: 'initial-uid' }));
            callback.mockClear();

            // Simulate change
            const newUser = createMockUser('new-sub-user');
            // NO 'act' NEEDED
            triggerAuthStateChange(newUser);
            expect(callback).toHaveBeenCalledWith(newUser);

            callback.mockClear();
            // Simulate logout
            triggerAuthStateChange(null);
            expect(callback).toHaveBeenCalledWith(null);

            unsubscribe();
            // Check unsubscribe works
            callback.mockClear();
            triggerAuthStateChange(createMockUser('another-user'));
            expect(callback).not.toHaveBeenCalled();
        });
    });
});

