/**
 * @file useLPN.js
 * @description React hook for Local Part Number (LPN) generation and management
 */

import { useState, useCallback } from 'react';
import { useFirestore } from './useFirestore.js';
import {
    validateComponentForLPN,
    hasLPN,
    extractMPN,
    generateMPNHash,
    assembleLPN,
    isFieldLocked
} from '../utils/lpnUtils.js';

export const useLPN = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const { getNextSequence, updateExistingComponent } = useFirestore();

    /**
     * Generate and assign LPN to a component
     */
    const assignLPN = useCallback(async (component) => {
        setError('');
        setIsGenerating(true);

        try {
            // 1. Validate component has MPN
            if (!validateComponentForLPN(component)) {
                throw new Error('Component must have a Manufacturer Part Number (MPN) to generate LPN');
            }

            // 2. Check if component already has LPN
            if (hasLPN(component)) {
                throw new Error('Component already has an LPN assigned');
            }

            // 3. Extract MPN
            const mpn = extractMPN(component);
            if (!mpn) {
                throw new Error('Could not extract MPN from component');
            }

            // 4. Generate hash from MPN
            const hash = generateMPNHash(mpn);

            // 5. Get next sequence number from Firestore
            const sequenceResult = await getNextSequence();
            if (!sequenceResult.success) {
                throw new Error(sequenceResult.error || 'Failed to get sequence number');
            }

            // 6. Assemble complete LPN
            const lpn = assembleLPN(sequenceResult.sequence, hash);

            // 7. Update component with LPN
            const updateResult = await updateExistingComponent(component.id, {
                Local_Part_Number: lpn
            });

            if (!updateResult.success) {
                throw new Error(updateResult.error || 'Failed to update component with LPN');
            }

            setIsGenerating(false);
            return {
                success: true,
                lpn,
                sequence: sequenceResult.sequence,
                hash
            };

        } catch (err) {
            const errorMsg = err.message || 'Failed to generate LPN';
            setError(errorMsg);
            setIsGenerating(false);
            return {
                success: false,
                error: errorMsg
            };
        }
    }, [getNextSequence, updateExistingComponent]);

    /**
     * Generate LPN for multiple components
     */
    const assignLPNBatch = useCallback(async (components) => {
        setError('');
        setIsGenerating(true);

        const results = {
            success: [],
            failed: [],
            total: components.length
        };

        for (const component of components) {
            const result = await assignLPN(component);
            
            if (result.success) {
                results.success.push({
                    componentId: component.id,
                    lpn: result.lpn
                });
            } else {
                results.failed.push({
                    componentId: component.id,
                    error: result.error
                });
            }
        }

        setIsGenerating(false);
        return {
            success: results.failed.length === 0,
            ...results
        };
    }, [assignLPN]);

    /**
     * Check if a field can be edited (not locked by LPN)
     */
    const canEditField = useCallback((fieldName, component) => {
        return !isFieldLocked(fieldName, component);
    }, []);

    /**
     * Get LPN info from component
     */
    const getLPNInfo = useCallback((component) => {
        if (!hasLPN(component)) {
            return null;
        }

        const lpn = component.Local_Part_Number;
        const parts = lpn.split('-');

        if (parts.length !== 3 || parts[0] !== 'KL') {
            return {
                lpn,
                valid: false
            };
        }

        return {
            lpn,
            valid: true,
            sequence: parts[1],
            hash: parts[2],
            mpn: extractMPN(component)
        };
    }, []);

    /**
     * Validate LPN format
     */
    const validateLPNFormat = useCallback((lpn) => {
        if (!lpn || typeof lpn !== 'string') {
            return false;
        }

        // Format: KL-{5 digits}-{6 hex chars}
        const pattern = /^KL-\d{5}-[0-9A-F]{6}$/;
        return pattern.test(lpn);
    }, []);

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError('');
    }, []);

    return {
        isGenerating,
        error,
        assignLPN,
        assignLPNBatch,
        canEditField,
        getLPNInfo,
        validateLPNFormat,
        clearError,
        // Export utility functions for convenience
        hasLPN,
        validateComponentForLPN,
        isFieldLocked
    };
};