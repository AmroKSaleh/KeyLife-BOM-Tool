/**
 * @file useLPN.js
 * @description React hook for Local Part Number (LPN) generation and management
 */

import { useState, useCallback } from 'react';
import { useFirestore } from './useFirestore.js';
import {
    validateComponentForLPN, hasLPN, extractMPN, generateMPNHash,
    assembleLPN, isFieldLocked, formatSequence
} from '../utils/lpnUtils.js';

export const useLPN = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const { getNextSequence, updateExistingComponent } = useFirestore();

    const assignLPN = useCallback(async (component) => {
        // ... (assignLPN implementation unchanged)
        try {
            if (!validateComponentForLPN(component)) throw new Error('MPN required');
            if (hasLPN(component)) throw new Error('LPN exists');
            const mpn = extractMPN(component);
            if (!mpn) throw new Error('Could not extract MPN');

            const hash = generateMPNHash(mpn);
            const sequenceResult = await getNextSequence();
            if (!sequenceResult?.success) throw new Error(sequenceResult?.error || 'Seq fail');
            const lpn = assembleLPN(sequenceResult.sequence, hash);

            const updateResult = await updateExistingComponent(component.id, { Local_Part_Number: lpn });
            if (!updateResult?.success) throw new Error(updateResult?.error || 'Update fail');

            return { success: true, lpn, sequence: sequenceResult.sequence, hash };
        } catch (err) {
            const errorMsg = err.message || 'Assign LPN failed';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [getNextSequence, updateExistingComponent, setError]);

    const assignLPNBatch = useCallback(async (components) => {
        if (!components?.length) {
            return { overallSuccess: true, details: { processed: [], failed: [], total: 0 } };
        }
        setError('');
        setIsGenerating(true);

        const results = { processed: [], failed: [], total: components.length };
        let overallSuccess = true;

        try { // Added try block for the loop
            for (const component of components) {
                const result = await assignLPN(component); // assignLPN handles its own errors
                if (result.success) {
                    results.processed.push({ componentId: component.id, lpn: result.lpn });
                } else {
                    results.failed.push({ componentId: component.id, error: result.error || 'Unknown' });
                    overallSuccess = false;
                }
            }
        } catch (batchError) { // Catch unexpected errors during the batch loop itself
            console.error("Unexpected error during assignLPNBatch loop:", batchError);
            setError(`Batch processing failed unexpectedly: ${batchError.message}`);
            overallSuccess = false;
            // Optionally add a general failure note if specific component errors weren't caught
            // results.failed.push({ componentId: 'BATCH_ERROR', error: batchError.message });
        } finally { // Ensure state is reset even if an error occurs
            setIsGenerating(false);
        }

        return {
            overallSuccess: overallSuccess,
            details: results
        };

    }, [assignLPN, setError, setIsGenerating]);


    const canEditField = useCallback((fieldName, component) => !isFieldLocked(fieldName, component), []);
    const getLPNInfo = useCallback((component) => {
         if (!hasLPN(component)) return null;
         const lpn = component.Local_Part_Number;
         const parts = lpn.split('-');
         if (parts.length !== 3 || parts[0] !== 'KL' || !/^\d{5}$/.test(parts[1]) || !/^[0-9A-F]{6}$/.test(parts[2])) {
             return { lpn, valid: false };
         }
         return { lpn, valid: true, sequence: parts[1], hash: parts[2], mpn: extractMPN(component) };
     }, []);
    const validateLPNFormat = useCallback((lpn) => /^KL-\d{5}-[0-9A-F]{6}$/.test(lpn || ''), []);
    const clearError = useCallback(() => setError(''), [setError]);

    return {
        isGenerating, error, assignLPN, assignLPNBatch, canEditField,
        getLPNInfo, validateLPNFormat, clearError, hasLPN,
        validateComponentForLPN, isFieldLocked
    };
};

