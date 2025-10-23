/**
 * @file useFirestore.js
 * @description React hook for Firestore operations with real-time sync
 */

import { useState, useEffect, useCallback } from 'react';
import {
    subscribeToComponents,
    subscribeToProjectComponents,
    addComponent,
    addComponentsBatch,
    updateComponent,
    deleteComponent,
    deleteProjectComponents,
    deleteAllComponents,
    getNextLPNSequence,
    saveUserSettings,
    loadUserSettings,
    getAllComponents,
    checkMPNExists
} from '../services/firestoreService.js';
import { getCurrentUserId } from '../config/firebase.js';

export const useFirestore = () => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);

    // Get current user ID
    useEffect(() => {
        const uid = getCurrentUserId();
        if (uid) {
            setUserId(uid);
        } else {
            setLoading(false);
        }
    }, []);

    // Subscribe to components when userId is available
    useEffect(() => {
        if (!userId) return;

        setLoading(true);
        const unsubscribe = subscribeToComponents(userId, (data, err) => {
            if (err) {
                setError('Failed to load components: ' + err.message);
                setLoading(false);
                return;
            }
            
            setComponents(data || []);
            setLoading(false);
        });

        return unsubscribe;
    }, [userId]);

    /**
     * Add a single component
     */
    const addNewComponent = useCallback(async (componentData) => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await addComponent(userId, componentData);
            return { success: true };
        } catch (err) {
            const errorMsg = 'Failed to add component: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Add multiple components
     */
    const addComponentsInBatch = useCallback(async (componentsArray) => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await addComponentsBatch(userId, componentsArray);
            return { success: true, count: componentsArray.length };
        } catch (err) {
            const errorMsg = 'Failed to add components: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Update a component
     */
    const updateExistingComponent = useCallback(async (componentId, updates) => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await updateComponent(userId, componentId, updates);
            return { success: true };
        } catch (err) {
            const errorMsg = 'Failed to update component: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Delete a component
     */
    const removeComponent = useCallback(async (componentId) => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await deleteComponent(userId, componentId);
            return { success: true };
        } catch (err) {
            const errorMsg = 'Failed to delete component: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Delete all components in a project
     */
    const removeProject = useCallback(async (projectName) => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await deleteProjectComponents(userId, projectName);
            return { success: true };
        } catch (err) {
            const errorMsg = 'Failed to delete project: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Clear all components
     */
    const clearAllComponents = useCallback(async () => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await deleteAllComponents(userId);
            return { success: true };
        } catch (err) {
            const errorMsg = 'Failed to clear components: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Get next LPN sequence number
     */
    const getNextSequence = useCallback(async () => {
        try {
            const sequence = await getNextLPNSequence();
            return { success: true, sequence };
        } catch (err) {
            const errorMsg = 'Failed to get LPN sequence: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, []);

    /**
     * Save user settings
     */
    const saveSettings = useCallback(async (settings) => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await saveUserSettings(userId, settings);
            return { success: true };
        } catch (err) {
            const errorMsg = 'Failed to save settings: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Load user settings
     */
    const loadSettings = useCallback(async () => {
        if (!userId) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const settings = await loadUserSettings(userId);
            return { success: true, settings };
        } catch (err) {
            const errorMsg = 'Failed to load settings: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Check if MPN exists
     */
    const doesMPNExist = useCallback(async (mpn) => {
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const exists = await checkMPNExists(userId, mpn);
            return { success: true, exists };
        } catch (err) {
            const errorMsg = 'Failed to check MPN: ' + err.message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [userId]);

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError('');
    }, []);

    return {
        components,
        loading,
        error,
        userId,
        addNewComponent,
        addComponentsInBatch,
        updateExistingComponent,
        removeComponent,
        removeProject,
        clearAllComponents,
        getNextSequence,
        saveSettings,
        loadSettings,
        doesMPNExist,
        clearError
    };
};