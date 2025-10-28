/**
 * @file useLPN.test.js
 * @description Test suite for useLPN hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLPN } from '../src/hooks/useLPN.js';
import * as lpnUtils from '../src/utils/lpnUtils.js';

// --- Mock Dependencies ---
const mockUseFirestore = { getNextSequence: vi.fn(), updateExistingComponent: vi.fn() };
// Corrected mock path relative to THIS file
vi.mock('../src/hooks/useFirestore.js', () => ({ useFirestore: () => mockUseFirestore }));

// Ensure lpnUtils path is correct relative to THIS file
vi.spyOn(lpnUtils, 'generateMPNHash').mockImplementation((mpn) => {
    if (!mpn) return '000000';
    return `HASH${mpn.length}${mpn[0]}`.slice(0, 6).toUpperCase().padStart(6,'0');
});

describe('useLPN Hook', () => {
    const mockComponentWithoutMPN = { id: 'c1', Value: '10k' };
    const mockComponentWithMPN1 = { id: 'c2', 'Mfr. Part #': 'MPN123', Designator: 'R1' };
    const mockComponentWithMPN2 = { id: 'c3', 'MPN': 'MPN456', Designator: 'C1' };
    const mockComponentWithLPN = { id: 'c4', 'Mfr. Part #': 'MPN789', Local_Part_Number: 'KL-00001-ABCDEF' };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseFirestore.getNextSequence.mockResolvedValue({ success: true, sequence: 1 });
        mockUseFirestore.updateExistingComponent.mockResolvedValue({ success: true });
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => useLPN());
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.error).toBe('');
    });

    // --- Tests for assignLPN (Now correctly nested) ---
    describe('assignLPN', () => {
        it('should return error if component has no MPN', async () => { /* ... test logic ... */ });
        it('should return error if component already has LPN', async () => { /* ... test logic ... */ });
        it('should successfully assign LPN if component is valid', async () => { /* ... test logic ... */ });
        it('should set error state if getNextSequence fails', async () => { /* ... test logic ... */ });
        it('should set error state if updateExistingComponent fails', async () => { /* ... test logic ... */ });
        it('should set isGenerating state during operation', async () => { /* ... test logic ... */ });
    });

    // --- Test for assignLPNBatch (Now correctly nested) ---
    describe('assignLPNBatch', () => {
         it('should process each component and return aggregated results', async () => {
             const components = [
                 mockComponentWithMPN1,     // Success
                 mockComponentWithoutMPN, // Fail
                 mockComponentWithMPN2,     // Success
                 mockComponentWithLPN       // Fail
             ];
             const expectedSuccessCount = 2;
             const expectedFailCount = 2;
             let seqCounter = 1;
             mockUseFirestore.getNextSequence.mockImplementation(async () => ({ success: true, sequence: seqCounter++ }));

             const { result } = renderHook(() => useLPN());
             let batchResult;
             await act(async () => { batchResult = await result.current.assignLPNBatch(components); });

             expect(result.current.isGenerating).toBe(false);
             // Verify the overall success flag is correctly false
             expect(batchResult.overallSuccess).toBe(false);
             // Verify details structure and counts
             expect(batchResult.details.total).toBe(components.length);
             expect(batchResult.details.processed).toHaveLength(expectedSuccessCount);
             expect(batchResult.details.failed).toHaveLength(expectedFailCount);
             // Verify underlying calls
             expect(mockUseFirestore.getNextSequence).toHaveBeenCalledTimes(expectedSuccessCount);
             expect(mockUseFirestore.updateExistingComponent).toHaveBeenCalledTimes(expectedSuccessCount);
             // Verify specific failures
             expect(batchResult.details.failed.some(f => f.componentId === mockComponentWithoutMPN.id)).toBe(true);
             expect(batchResult.details.failed.some(f => f.componentId === mockComponentWithLPN.id)).toBe(true);
         });
    });

    // --- Tests for Utility Functions (Now correctly nested) ---
    describe('Utility Functions Re-exports', () => {
         it('canEditField should correctly call lpnUtils.isFieldLocked', () => { /* ... test logic ... */ });
         it('getLPNInfo should correctly call lpnUtils and return info', () => { /* ... test logic ... */ });
         it('validateLPNFormat should correctly call lpnUtils', () => { /* ... test logic ... */ });
    });

    it('clearError should reset the error state', async () => { /* ... test logic ... */ });

});
