/**
 * @file firebase.js
 * @description Firebase configuration and initialization with full authentication
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';


// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google
 * @returns {Promise<object>} User object
 */
export async function signInWithGoogle() {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || userCredential.user.email
    };
}

/**
 * Sign up with email and password
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName 
 * @returns {Promise<object>} User object
 */
export async function signUp(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
    }
    
    return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName || userCredential.user.email
    };
}

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} User object
 */
export async function signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || userCredential.user.email
    };
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function logOut() {
    await signOut(auth);
}

/**
 * Send password reset email
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
}

/**
 * Gets current user ID (null if not authenticated)
 * @returns {string|null}
 */
export function getCurrentUserId() {
    return auth.currentUser?.uid || null;
}

/**
 * Gets current user info
 * @returns {object|null}
 */
export function getCurrentUser() {
    const user = auth.currentUser;
    if (!user) return null;
    
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email
    };
}

/**
 * Subscribe to auth state changes
 * @param {function} callback - Called with user object or null
 * @returns {function} Unsubscribe function
 */
export function subscribeToAuthChanges(callback) {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            callback({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email
            });
        } else {
            callback(null);
        }
    });
}