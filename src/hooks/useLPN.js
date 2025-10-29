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
    
    // Update destructured imports from useFirestore
    const { getNextSequence, updateExistingComponent, findLPNByMPN } = useFirestore(); // findLPNByMPN is new

    const assignLPN = useCallback(async (component) => {
        setIsGenerating(true);
        setError('');

        try {
            if (!validateComponentForLPN(component)) throw new Error('MPN required for LPN assignment');
            if (hasLPN(component)) throw new Error('Component already has an LPN');
            
            // Extract the canonical MPN
            const mpn = extractMPN(component);
            if (!mpn) throw new Error('Could not extract MPN');

            // 1. CHECK FOR EXISTING LPN IN DB FOR THIS MPN (Consistency Check)
            const existingLPNResult = await findLPNByMPN(mpn);
            let finalLPN = null;
            
            if (existingLPNResult.success && existingLPNResult.lpn) {
                // LPN already exists for this component type. Reuse it.
                finalLPN = existingLPNResult.lpn;
            } else {
                // 2. GENERATE NEW LPN (if no existing LPN found)
                const hash = generateMPNHash(mpn);
                const sequenceResult = await getNextSequence();
                if (!sequenceResult?.success) throw new Error(sequenceResult?.error || 'Failed to get LPN sequence');
                
                finalLPN = assembleLPN(sequenceResult.sequence, hash);
            }

            // 3. ASSIGN LPN to the current component using its document ID
            // NOTE: The component passed here must have its Firestore ID set (handled in App.jsx)
            const updateResult = await updateExistingComponent(component.id, { 
                Local_Part_Number: finalLPN,
                // Ensure the canonical MPN field is set on the component before update, 
                // as this is the field used for the DB query in findLPNForMPN.
                'Mfr. Part #': mpn 
            });

            if (!updateResult?.success) throw new Error(updateResult?.error || 'Failed to update component with LPN');

            return { success: true, lpn: finalLPN };
        } catch (err) {
            const errorMsg = err.message || 'Assign LPN failed';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsGenerating(false);
        }
    }, [getNextSequence, updateExistingComponent, findLPNByMPN]);

    const assignLPNBatch = useCallback(async (components) => {
        if (!components?.length) {
            return { overallSuccess: true, details: { processed: [], failed: [], total: 0 } };
        }
        setError('');
        setIsGenerating(true);

        const results = { processed: [], failed: [], total: components.length };
        let overallSuccess = true;

        try { 
            for (const component of components) {
                const result = await assignLPN(component); 
                if (result.success) {
                    results.processed.push({ componentId: component.id, lpn: result.lpn });
                } else {
                    results.failed.push({ componentId: component.id, error: result.error || 'Unknown' });
                    overallSuccess = false;
                }
            }
        } catch (batchError) { 
            console.error("Unexpected error during assignLPNBatch loop:", batchError);
            setError(`Batch processing failed unexpectedly: ${batchError.message}`);
            overallSuccess = false;
        } finally { 
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