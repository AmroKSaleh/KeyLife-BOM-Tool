/**
 * @file firestoreService.js
 * @description Firestore database operations for BOM data
 */

import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, onSnapshot, runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase.js'; // Ensure path is correct

// --- Helper Functions (unchanged) ---
function getUserComponentsRef(userId) { /* ... */ }
function getUserSettingsRef(userId) { /* ... */ }
function getLPNCounterRef() { /* ... */ }

/**
 * Subscribe to user's components in real-time
 * Accepts both a success and an error callback.
 */
export function subscribeToComponents(userId, successCallback, errorCallback) {
    if (!userId || !successCallback) {
        console.error("User ID and success callback are required for subscription.");
        if (errorCallback) errorCallback(null, new Error("User ID and success callback required"));
        return () => {}; // Return no-op unsubscribe
    }
    const componentsRef = getUserComponentsRef(userId);

    // Pass both callbacks to onSnapshot
    return onSnapshot(componentsRef, (snapshot) => {
        const components = [];
        snapshot.forEach((doc) => {
            components.push({ id: doc.id, ...doc.data() });
        });
        successCallback(components); // Call success callback with data
    }, (error) => {
        // Call the provided error callback if an error occurs
        console.error('Error subscribing to components:', error);
        if (errorCallback) {
            errorCallback(null, error);
        } else {
            // Fallback if no error callback provided
            console.error("Unhandled subscription error:", error);
        }
    });
}

/**
 * Subscribe to components for a specific project
 * Accepts both a success and an error callback.
 */
export function subscribeToProjectComponents(userId, projectName, successCallback, errorCallback) {
     if (!userId || !projectName || !successCallback) {
        console.error("User ID, project name, and success callback are required.");
         if (errorCallback) errorCallback(null, new Error("User ID, project name, and success callback required"));
        return () => {};
    }
    const componentsRef = getUserComponentsRef(userId);
    const q = query(componentsRef, where('ProjectName', '==', projectName));

    // Pass both callbacks to onSnapshot
    return onSnapshot(q, (snapshot) => {
        const components = [];
        snapshot.forEach((doc) => {
            components.push({ id: doc.id, ...doc.data() });
        });
        successCallback(components); // Call success callback
    }, (error) => {
        // Call the provided error callback
        console.error('Error subscribing to project components:', error);
        if (errorCallback) {
             errorCallback(null, error);
        } else {
             console.error("Unhandled subscription error:", error);
        }
    });
}


// --- Write/Read Operations (signatures unchanged) ---
export async function addComponent(userId, componentData) { /* ... */ }
export async function addComponentsBatch(userId, components) { /* ... */ }
export async function updateComponent(userId, componentId, updates) { /* ... */ }
export async function deleteComponent(userId, componentId) { /* ... */ }
export async function deleteProjectComponents(userId, projectName) { /* ... */ }
export async function deleteAllComponents(userId) { /* ... */ }
export async function getNextLPNSequence() { /* ... */ }
export async function saveUserSettings(userId, settings) { /* ... */ }
export async function loadUserSettings(userId) { /* ... */ }
export async function getComponentById(userId, componentId) { /* ... */ }
export async function getAllComponents(userId) { /* ... */ }
export async function checkMPNExists(userId, mpn) { /* ... */ }
