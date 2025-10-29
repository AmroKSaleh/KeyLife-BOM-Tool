/**
 * @file useLPN.test.js
 * @description Test suite for useLPN hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLPN } from '../src/hooks/useLPN.js';
import * as lpnUtils from '../src/utils/lpnUtils.js';

// --- Mock Dependencies ---
// Define mocks with default successful implementations
const mockUseFirestore = {
    getNextSequence: vi.fn(),
    updateExistingComponent: vi.fn(),
    findLPNByMPN: vi.fn()
};

// **Mock the module containing the hook**
vi.mock('../src/hooks/useFirestore.js', () => ({
    // Ensure the factory function returns the hook itself
    useFirestore: () => mockUseFirestore
}));

// Spy on lpnUtils functions
vi.spyOn(lpnUtils, 'generateMPNHash').mockImplementation((mpn) => {
    if (!mpn) return '000000';
    // Simple but valid hex generator
    const baseHash = mpn.length * 12345 + mpn.charCodeAt(0);
    return baseHash.toString(16).toUpperCase().padStart(6, 'A').slice(-6);
});


describe('useLPN Hook', () => {
    const mockComponentWithoutMPN = { id: 'c1', Value: '10k' };
    const mockComponentWithMPN1 = { id: 'c2', 'Mfr. Part #': 'MPN123', Designator: 'R1' };
    const mockComponentWithMPN2 = { id: 'c3', 'MPN': 'MPN456', Designator: 'C1' }; // Using alternate MPN field
    const mockComponentWithLPN = { id: 'c4', 'Mfr. Part #': 'MPN789', Local_Part_Number: 'KL-00001-ABCDEF' };

    // Function to render the hook, ensuring mocks are ready
    const setupHook = () => renderHook(() => useLPN());

    beforeEach(() => {
        // Clear all mocks AND reset implementations before each test
        vi.clearAllMocks();
        mockUseFirestore.getNextSequence.mockResolvedValue({ success: true, sequence: 1 });
        mockUseFirestore.updateExistingComponent.mockResolvedValue({ success: true });
        
        // **FIX:** Make findLPNByMPN truly async to prevent race conditions in tests
        mockUseFirestore.findLPNByMPN.mockImplementation(async () => {
             await new Promise(resolve => setTimeout(resolve, 1)); // 1ms delay
             return { success: true, lpn: null }; // Default: No existing LPN found
        });
    });

    it('should initialize with correct default state', () => {
        const { result } = setupHook();
        // Check hook initialization
        expect(result.current, 'Hook did not initialize correctly').not.toBeNull();
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.error).toBe('');
    });

    // --- Tests for assignLPN ---
    describe('assignLPN', () => {
        it('should return error if component has no MPN', async () => {
            const { result } = setupHook();
            expect(result.current, 'Hook invalid in test').not.toBeNull();
            let res;
            await act(async () => { res = await result.current.assignLPN(mockComponentWithoutMPN); });
            expect(res.success).toBe(false);
            expect(res.error).toContain('MPN required');
            expect(result.current.error).toContain('MPN required');
        });

        it('should return error if component already has LPN', async () => {
            const { result } = setupHook();
            expect(result.current, 'Hook invalid in test').not.toBeNull();
            let res;
            await act(async () => { res = await result.current.assignLPN(mockComponentWithLPN); });
            expect(res.success).toBe(false);
            expect(res.error).toContain('already has an LPN');
        });

        it('should successfully assign NEW LPN if component is valid and no existing found', async () => {
             const { result } = setupHook();
             expect(result.current, 'Hook invalid in test').not.toBeNull();
             let res;
             await act(async () => { res = await result.current.assignLPN(mockComponentWithMPN1); });
             expect(res.success).toBe(true);
             expect(res.lpn).toMatch(/^KL-\d{5}-[0-9A-F]{6}$/);
             expect(mockUseFirestore.findLPNByMPN).toHaveBeenCalledWith('MPN123');
             expect(mockUseFirestore.getNextSequence).toHaveBeenCalledTimes(1);
             expect(mockUseFirestore.updateExistingComponent).toHaveBeenCalledWith(
                 mockComponentWithMPN1.id,
                 expect.objectContaining({ Local_Part_Number: res.lpn, 'Mfr. Part #': 'MPN123' })
             );
        });

        it('should REUSE existing LPN if found for the MPN', async () => {
            const existingLPN = 'KL-99999-EXISTG';
            // Update mock for this specific test
            mockUseFirestore.findLPNByMPN.mockResolvedValue({ success: true, lpn: existingLPN });

            const { result } = setupHook();
            expect(result.current, 'Hook invalid in test').not.toBeNull();
            let res;
            await act(async () => { res = await result.current.assignLPN(mockComponentWithMPN1); });

            expect(res.success).toBe(true);
            expect(res.lpn).toBe(existingLPN);
            expect(mockUseFirestore.findLPNByMPN).toHaveBeenCalledWith('MPN123');
            expect(mockUseFirestore.getNextSequence).not.toHaveBeenCalled();
            expect(mockUseFirestore.updateExistingComponent).toHaveBeenCalledWith(
                mockComponentWithMPN1.id,
                expect.objectContaining({ Local_Part_Number: existingLPN, 'Mfr. Part #': 'MPN123' })
            );
        });

        it('should set error state if findLPNByMPN fails', async () => {
             const dbError = new Error('DB Search Error');
             // **FIX:** Mock rejection for error paths
             mockUseFirestore.findLPNByMPN.mockRejectedValue(dbError);

             const { result } = setupHook();
             expect(result.current, 'Hook invalid in test').not.toBeNull();
             let res;
             await act(async () => { res = await result.current.assignLPN(mockComponentWithMPN1); });

             expect(res.success).toBe(false);
             expect(res.error).toContain('DB Search Error');
             expect(result.current.error).toContain('DB Search Error');
         });

        it('should set error state if getNextSequence fails', async () => {
            // **FIX:** Mock rejection or success:false for error paths
            mockUseFirestore.getNextSequence.mockResolvedValue({ success: false, error: 'Sequence Error' });
            const { result } = setupHook();
            expect(result.current, 'Hook invalid in test').not.toBeNull();
            let res;
            await act(async () => { res = await result.current.assignLPN(mockComponentWithMPN1); });
            expect(res.success).toBe(false);
            expect(res.error).toContain('Sequence Error');
        });

        it('should set error state if updateExistingComponent fails', async () => {
            // **FIX:** Mock rejection or success:false for error paths
            mockUseFirestore.updateExistingComponent.mockResolvedValue({ success: false, error: 'Update Error' });
            const { result } = setupHook();
            expect(result.current, 'Hook invalid in test').not.toBeNull();
            let res;
            await act(async () => { res = await result.current.assignLPN(mockComponentWithMPN1); });
            expect(res.success).toBe(false);
            expect(res.error).toContain('Update Error');
        });

        it('should set isGenerating state during operation', async () => {
            const { result } = setupHook();
            expect(result.current, 'Hook invalid in test').not.toBeNull();
            expect(result.current.isGenerating).toBe(false); // Initial state

            let assignPromise;
            // **FIX:** Call the function inside act, but don't await it
            act(() => {
                assignPromise = result.current.assignLPN(mockComponentWithMPN1);
            });

            // **FIX:** Use waitFor to check for the intermediate 'true' state
            // This waits until the expect callback passes or times out
            await waitFor(() => {
                expect(result.current.isGenerating).toBe(true);
            });

            // **FIX:** Await the original promise and check for the final 'false' state
            // We wrap the await in act() to flush the final state update
            await act(async () => {
                await assignPromise;
            });
            expect(result.current.isGenerating).toBe(false);
        });
    });

    // --- Test for assignLPNBatch ---
    describe('assignLPNBatch', () => {
         it('should process each component and return aggregated results', async () => {
             const components = [
                 mockComponentWithMPN1,     // Success (Seq 1)
                 mockComponentWithoutMPN, // Fail (No MPN)
                 mockComponentWithMPN2,     // Success (Seq 2)
                 mockComponentWithLPN       // Fail (Has LPN)
             ];
             const expectedSuccessCount = 2;
             const expectedFailCount = 2;
             let seqCounter = 1;

             // Reset mocks for batch logic
             mockUseFirestore.getNextSequence.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return { success: true, sequence: seqCounter++ };
             });
             mockUseFirestore.updateExistingComponent.mockResolvedValue({ success: true });
             mockUseFirestore.findLPNByMPN.mockImplementation(async (mpn) => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return { success: true, lpn: null };
             });

             const { result } = setupHook();
             expect(result.current, 'Hook invalid in test').not.toBeNull();
             let batchResult;

             await act(async () => {
                 batchResult = await result.current.assignLPNBatch(components);
             });

             expect(result.current.isGenerating).toBe(false);
             expect(batchResult.overallSuccess).toBe(false);
             expect(batchResult.details.total).toBe(components.length);
             expect(batchResult.details.processed).toHaveLength(expectedSuccessCount);
             expect(batchResult.details.failed).toHaveLength(expectedFailCount);
             expect(mockUseFirestore.findLPNByMPN).toHaveBeenCalledTimes(expectedSuccessCount);
             expect(mockUseFirestore.getNextSequence).toHaveBeenCalledTimes(expectedSuccessCount);
             expect(mockUseFirestore.updateExistingComponent).toHaveBeenCalledTimes(expectedSuccessCount);
             expect(batchResult.details.failed.some(f => f.componentId === mockComponentWithoutMPN.id && f.error.includes('MPN required'))).toBe(true);
             expect(batchResult.details.failed.some(f => f.componentId === mockComponentWithLPN.id && f.error.includes('already has an LPN'))).toBe(true);
         });

         it('should handle an empty component list gracefully', async () => {
             const { result } = setupHook();
             expect(result.current, 'Hook invalid in test').not.toBeNull();
             let batchResult;
             await act(async () => { batchResult = await result.current.assignLPNBatch([]); });
             expect(batchResult.overallSuccess).toBe(true);
             expect(batchResult.details.total).toBe(0);
             expect(batchResult.details.processed).toHaveLength(0);
             expect(batchResult.details.failed).toHaveLength(0);
         });

         it('should correctly reuse LPNs during batch processing', async () => {
             const existingLPN = 'KL-00100-REPEAT';
             const components = [
                 { id: 'new1', 'Mfr. Part #': 'MPN_NEW' },       // Should get Seq 1
                 { id: 'reuse1', 'Mfr. Part #': 'MPN_REUSE' },   // Should reuse existingLPN
                 { id: 'new2', 'Mfr. Part #': 'MPN_NEW2' },      // Should get Seq 2
                 { id: 'reuse2', 'Mfr. Part #': 'MPN_REUSE' },   // Should reuse existingLPN again
             ];
             let seqCounter = 1;
             mockUseFirestore.getNextSequence.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return { success: true, sequence: seqCounter++ };
             });
             mockUseFirestore.updateExistingComponent.mockResolvedValue({ success: true });
             mockUseFirestore.findLPNByMPN.mockImplementation(async (mpn) => {
                 await new Promise(resolve => setTimeout(resolve, 1));
                 if (mpn === 'MPN_REUSE') {
                     return { success: true, lpn: existingLPN };
                 }
                 return { success: true, lpn: null };
             });

             const { result } = setupHook();
             expect(result.current, 'Hook invalid in test').not.toBeNull();
             let batchResult;
             await act(async () => { batchResult = await result.current.assignLPNBatch(components); });

             expect(batchResult.overallSuccess).toBe(true);
             expect(batchResult.details.processed).toHaveLength(4);
             expect(batchResult.details.failed).toHaveLength(0);
             expect(mockUseFirestore.getNextSequence).toHaveBeenCalledTimes(2);
             expect(mockUseFirestore.updateExistingComponent).toHaveBeenCalledTimes(4);

             const processedMap = batchResult.details.processed.reduce((acc, item) => {
                 acc[item.componentId] = item.lpn;
                 return acc;
             }, {});

             expect(processedMap['new1']).not.toBe(existingLPN);
             expect(processedMap['new1']).toMatch(/^KL-00001-[0-9A-F]{6}$/);
             expect(processedMap['reuse1']).toBe(existingLPN);
             expect(processedMap['new2']).not.toBe(existingLPN);
             expect(processedMap['new2']).toMatch(/^KL-00002-[0-9A-F]{6}$/);
             expect(processedMap['reuse2']).toBe(existingLPN);
         });

    });

    // --- Tests for Utility Functions Re-exports ---
    describe('Utility Functions Re-exports', () => {
         it('canEditField should correctly reflect lpnUtils.isFieldLocked', () => {
            const { result } = setupHook();
            expect(result.current, 'Hook invalid in test').not.toBeNull();
            const isLockedSpy = vi.spyOn(lpnUtils, 'isFieldLocked');
            result.current.canEditField('Value', mockComponentWithLPN);
            expect(isLockedSpy).toHaveBeenCalledWith('Value', mockComponentWithLPN);
            expect(result.current.canEditField('Value', mockComponentWithLPN)).toBe(true);
            isLockedSpy.mockRestore();
         });
         it('getLPNInfo should correctly call lpnUtils and return info', () => {
             const { result } = setupHook();
             expect(result.current, 'Hook invalid in test').not.toBeNull();
             const info = result.current.getLPNInfo(mockComponentWithLPN);
             expect(info).toEqual(expect.objectContaining({
                 lpn: 'KL-00001-ABCDEF',
                 valid: true,
                 sequence: '00001',
                 hash: 'ABCDEF'
             }));
             expect(result.current.getLPNInfo(mockComponentWithMPN1)).toBeNull();
         });
         it('validateLPNFormat should correctly call lpnUtils', () => {
             const { result } = setupHook();
             expect(result.current, 'Hook invalid in test').not.toBeNull();
             expect(result.current.validateLPNFormat('KL-12345-ABCDEF')).toBe(true);
             expect(result.current.validateLPNFormat('KL-1234-ABCDEF')).toBe(false);
             expect(result.current.validateLPNFormat('KL-12345-ABCDEZ')).toBe(false);
         });
    });

    it('clearError should reset the error state', async () => {
        const { result } = setupHook();
        expect(result.current, 'Hook invalid in test').not.toBeNull();
        // Force an error
        mockUseFirestore.findLPNByMPN.mockRejectedValue(new Error('Trigger Error'));
        await act(async () => { await result.current.assignLPN(mockComponentWithMPN1); });
        expect(result.current.error).not.toBe('');
        // Clear it
        act(() => { result.current.clearError(); });
        expect(result.current.error).toBe('');
    });

});

