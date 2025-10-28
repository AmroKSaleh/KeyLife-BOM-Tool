/**
 * @file firestoreService.js
 * @description Firestore database operations for BOM data
 */

import { 
    collection, 
    doc, 
    getDoc,
    getDocs,
    setDoc, 
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    increment,
    runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Get user's components collection reference
 */
function getUserComponentsRef(userId) {
    return collection(db, 'users', userId, 'components');
}

/**
 * Get user's settings document reference
 */
function getUserSettingsRef(userId) {
    return doc(db, 'users', userId, 'settings', 'preferences');
}

/**
 * Get global LPN counter reference
 */
function getLPNCounterRef() {
    return doc(db, 'system', 'lpn_counter');
}

/**
 * Subscribe to user's components in real-time
 */
export function subscribeToComponents(userId, callback) {
    const componentsRef = getUserComponentsRef(userId);
    
    return onSnapshot(componentsRef, (snapshot) => {
        const components = [];
        snapshot.forEach((doc) => {
            components.push({ id: doc.id, ...doc.data() });
        });
        callback(components);
    }, (error) => {
        console.error('Error subscribing to components:', error);
        callback(null, error);
    });
}

/**
 * Subscribe to components for a specific project
 */
export function subscribeToProjectComponents(userId, projectName, callback) {
    const componentsRef = getUserComponentsRef(userId);
    const q = query(componentsRef, where('ProjectName', '==', projectName));
    
    return onSnapshot(q, (snapshot) => {
        const components = [];
        snapshot.forEach((doc) => {
            components.push({ id: doc.id, ...doc.data() });
        });
        callback(components);
    }, (error) => {
        console.error('Error subscribing to project components:', error);
        callback(null, error);
    });
}

/**
 * Add a new component
 */
export async function addComponent(userId, componentData) {
    const componentRef = doc(getUserComponentsRef(userId), componentData.id);
    await setDoc(componentRef, {
        ...componentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    return componentData.id;
}

/**
 * Add multiple components in batch
 */
export async function addComponentsBatch(userId, components) {
    const promises = components.map(component => addComponent(userId, component));
    return Promise.all(promises);
}

/**
 * Update an existing component
 */
export async function updateComponent(userId, componentId, updates) {
    const componentRef = doc(getUserComponentsRef(userId), componentId);
    await updateDoc(componentRef, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
}

/**
 * Delete a component
 */
export async function deleteComponent(userId, componentId) {
    const componentRef = doc(getUserComponentsRef(userId), componentId);
    await deleteDoc(componentRef);
}

/**
 * Delete all components for a project
 */
export async function deleteProjectComponents(userId, projectName) {
    const componentsRef = getUserComponentsRef(userId);
    const q = query(componentsRef, where('ProjectName', '==', projectName));
    const snapshot = await getDocs(q);
    
    const deletePromises = [];
    snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
    });
    
    return Promise.all(deletePromises);
}

/**
 * Delete all components for a user
 */
export async function deleteAllComponents(userId) {
    const componentsRef = getUserComponentsRef(userId);
    const snapshot = await getDocs(componentsRef);
    
    const deletePromises = [];
    snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
    });
    
    return Promise.all(deletePromises);
}

/**
 * Get next LPN sequence number (atomic increment)
 */
export async function getNextLPNSequence() {
    const counterRef = getLPNCounterRef();
    
    return runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let currentSequence = 0;
        if (counterDoc.exists()) {
            currentSequence = counterDoc.data().sequence || 0;
        }
        
        const nextSequence = currentSequence + 1;
        
        if (nextSequence > 99999) {
            throw new Error('LPN sequence limit reached (99999)');
        }
        
        transaction.set(counterRef, { sequence: nextSequence }, { merge: true });
        
        return nextSequence;
    });
}

/**
 * Save user settings/preferences
 */
export async function saveUserSettings(userId, settings) {
    const settingsRef = getUserSettingsRef(userId);
    await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString()
    }, { merge: true });
}

/**
 * Load user settings/preferences
 */
export async function loadUserSettings(userId) {
    const settingsRef = getUserSettingsRef(userId);
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
        return settingsDoc.data();
    }
    
    return null;
}

/**
 * Get component by ID
 */
export async function getComponentById(userId, componentId) {
    const componentRef = doc(getUserComponentsRef(userId), componentId);
    const componentDoc = await getDoc(componentRef);
    
    if (componentDoc.exists()) {
        return { id: componentDoc.id, ...componentDoc.data() };
    }
    
    return null;
}

/**
 * Get all components for a user
 */
export async function getAllComponents(userId) {
    const componentsRef = getUserComponentsRef(userId);
    const snapshot = await getDocs(componentsRef);
    
    const components = [];
    snapshot.forEach((doc) => {
        components.push({ id: doc.id, ...doc.data() });
    });
    
    return components;
}

/**
 * Check if component with MPN already exists
 */
export async function checkMPNExists(userId, mpn) {
    const componentsRef = getUserComponentsRef(userId);
    const q = query(componentsRef, where('Mfr. Part #', '==', mpn));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
}

/**
 * Find existing LPN for a component with a given MPN
 * Searches for any component matching the canonical MPN field that has an LPN assigned.
 * This is the LPN Consistency Check.
 */
export async function findLPNForMPN(userId, mpn) {
    const componentsRef = getUserComponentsRef(userId);
    // Query for components matching the canonical MPN field that have an LPN set
    const q = query(
        componentsRef, 
        where('Mfr. Part #', '==', mpn),
        // Filter where Local_Part_Number field exists and is not null/empty string (implicitly handled by firestore)
        where('Local_Part_Number', '!=', null) 
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        // Return the LPN from the first match
        return snapshot.docs[0].data().Local_Part_Number;
    }
    
    return null;
}
