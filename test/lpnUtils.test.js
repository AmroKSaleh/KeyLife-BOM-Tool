/**
 * @file lpnUtils.test.js
 * @description Test suite for LPN utility functions using Vitest
 * Run with: npm test or npx vitest
 */

import { describe, it, expect } from 'vitest';
import {
    formatSequence,
    generateMPNHash,
    extractMPN,
    assembleLPN,
    validateComponentForLPN,
    hasLPN,
    isFieldLocked
} from '../src/utils/lpnUtils.js';

describe('formatSequence', () => {
    it('should format single digit numbers correctly', () => {
        expect(formatSequence(1)).toBe('00001');
        expect(formatSequence(5)).toBe('00005');
        expect(formatSequence(9)).toBe('00009');
    });

    it('should format three digit numbers correctly', () => {
        expect(formatSequence(123)).toBe('00123');
        expect(formatSequence(456)).toBe('00456');
    });

    it('should format five digit numbers correctly', () => {
        expect(formatSequence(99999)).toBe('99999');
        expect(formatSequence(12345)).toBe('12345');
    });

    it('should format two digit numbers correctly', () => {
        expect(formatSequence(42)).toBe('00042');
    });

    it('should throw error for zero', () => {
        expect(() => formatSequence(0)).toThrow('Sequence number must be between 1 and 99999');
    });

    it('should throw error for numbers greater than 99999', () => {
        expect(() => formatSequence(100000)).toThrow('Sequence number must be between 1 and 99999');
    });

    it('should throw error for invalid input', () => {
        expect(() => formatSequence('invalid')).toThrow('Sequence number must be between 1 and 99999');
        expect(() => formatSequence(null)).toThrow('Sequence number must be between 1 and 99999');
        expect(() => formatSequence(undefined)).toThrow('Sequence number must be between 1 and 99999');
    });

    it('should throw error for negative numbers', () => {
        expect(() => formatSequence(-1)).toThrow('Sequence number must be between 1 and 99999');
    });
});

describe('generateMPNHash', () => {
    it('should generate 6 character hash', () => {
        const hash = generateMPNHash('RC0603FR-07100KL');
        expect(hash).toHaveLength(6);
    });

    it('should generate uppercase hex hash', () => {
        const hash = generateMPNHash('STM32F407VGT6');
        expect(hash).toMatch(/^[0-9A-F]{6}$/);
    });

    it('should generate consistent hashes for same input', () => {
        const hash1 = generateMPNHash('RC0603FR-07100KL');
        const hash2 = generateMPNHash('RC0603FR-07100KL');
        expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
        const hash1 = generateMPNHash('RC0603FR-07100KL');
        const hash2 = generateMPNHash('STM32F407VGT6');
        expect(hash1).not.toBe(hash2);
    });

    it('should be case-insensitive', () => {
        const hashUpper = generateMPNHash('RC0603FR-07100KL');
        const hashLower = generateMPNHash('rc0603fr-07100kl');
        const hashMixed = generateMPNHash('Rc0603Fr-07100Kl');
        expect(hashUpper).toBe(hashLower);
        expect(hashUpper).toBe(hashMixed);
    });

    it('should trim whitespace', () => {
        const hashNoSpaces = generateMPNHash('RC0603FR-07100KL');
        const hashWithSpaces = generateMPNHash('  RC0603FR-07100KL  ');
        expect(hashNoSpaces).toBe(hashWithSpaces);
    });

    it('should return 000000 for empty or invalid input', () => {
        expect(generateMPNHash('')).toBe('000000');
        expect(generateMPNHash(null)).toBe('000000');
        expect(generateMPNHash(undefined)).toBe('000000');
    });
});

describe('extractMPN', () => {
    it('should extract from "Mfr. Part #" field', () => {
        const component = { 'Mfr. Part #': 'RC0603FR-07100KL' };
        expect(extractMPN(component)).toBe('RC0603FR-07100KL');
    });

    it('should extract from "MPN" field', () => {
        const component = { 'MPN': 'STM32F407VGT6' };
        expect(extractMPN(component)).toBe('STM32F407VGT6');
    });

    it('should extract from "Part Number" field', () => {
        const component = { 'Part Number': 'LM358DR' };
        expect(extractMPN(component)).toBe('LM358DR');
    });

    it('should extract from "PartNumber" field', () => {
        const component = { 'PartNumber': 'TL072CDR' };
        expect(extractMPN(component)).toBe('TL072CDR');
    });

    it('should extract from "Part#" field', () => {
        const component = { 'Part#': 'NE555P' };
        expect(extractMPN(component)).toBe('NE555P');
    });

    it('should return null when MPN not found', () => {
        const component = { 'Value': '100k', 'Description': 'Resistor' };
        expect(extractMPN(component)).toBeNull();
    });

    it('should trim whitespace from MPN', () => {
        const component = { 'Mfr. Part #': '  RC0603FR-07100KL  ' };
        expect(extractMPN(component)).toBe('RC0603FR-07100KL');
    });

    it('should return null for empty object', () => {
        expect(extractMPN({})).toBeNull();
    });

    it('should return null for null input', () => {
        expect(extractMPN(null)).toBeNull();
    });

    it('should prioritize fields in order', () => {
        const component = {
            'Part#': 'WRONG',
            'MPN': 'WRONG',
            'Mfr. Part #': 'CORRECT'
        };
        expect(extractMPN(component)).toBe('CORRECT');
    });
});

describe('assembleLPN', () => {
    it('should assemble LPN with single digit sequence', () => {
        expect(assembleLPN(1, 'A3F142')).toBe('KL-00001-A3F142');
    });

    it('should assemble LPN with three digit sequence', () => {
        expect(assembleLPN(123, 'B7E293')).toBe('KL-00123-B7E293');
    });

    it('should assemble LPN with max sequence', () => {
        expect(assembleLPN(99999, 'FFFFFF')).toBe('KL-99999-FFFFFF');
    });

    it('should have correct format structure', () => {
        const lpn = assembleLPN(42, 'ABC123');
        expect(lpn).toMatch(/^KL-\d{5}-[0-9A-F]{6}$/);
    });
});

describe('validateComponentForLPN', () => {
    it('should validate component with valid MPN', () => {
        const component = { 'Mfr. Part #': 'RC0603FR-07100KL' };
        expect(validateComponentForLPN(component)).toBe(true);
    });

    it('should not validate component without MPN', () => {
        const component = { 'Value': '100k' };
        expect(validateComponentForLPN(component)).toBe(false);
    });

    it('should not validate component with empty MPN', () => {
        const component = { 'Mfr. Part #': '' };
        expect(validateComponentForLPN(component)).toBe(false);
    });

    it('should not validate component with whitespace-only MPN', () => {
        const component = { 'Mfr. Part #': '   ' };
        expect(validateComponentForLPN(component)).toBe(false);
    });

    it('should validate component with MPN in any supported field', () => {
        expect(validateComponentForLPN({ 'MPN': 'TEST123' })).toBe(true);
        expect(validateComponentForLPN({ 'Part Number': 'TEST123' })).toBe(true);
        expect(validateComponentForLPN({ 'PartNumber': 'TEST123' })).toBe(true);
    });
});

describe('hasLPN', () => {
    it('should detect component with LPN', () => {
        const component = { 'Local_Part_Number': 'KL-00123-A3F142' };
        expect(hasLPN(component)).toBe(true);
    });

    it('should detect component without LPN', () => {
        const component = { 'Mfr. Part #': 'RC0603FR-07100KL' };
        expect(hasLPN(component)).toBe(false);
    });

    it('should detect empty LPN as no LPN', () => {
        const component = { 'Local_Part_Number': '' };
        expect(hasLPN(component)).toBe(false);
    });

    it('should detect whitespace LPN as no LPN', () => {
        const component = { 'Local_Part_Number': '   ' };
        expect(hasLPN(component)).toBe(false);
    });

    it('should handle null input', () => {
        expect(hasLPN(null)).toBe(false);
    });

    it('should handle undefined input', () => {
        expect(hasLPN(undefined)).toBe(false);
    });

    it('should handle empty object', () => {
        expect(hasLPN({})).toBe(false);
    });
});

describe('isFieldLocked', () => {
    const componentWithLPN = {
        'Mfr. Part #': 'RC0603FR-07100KL',
        'Local_Part_Number': 'KL-00123-A3F142',
        'Value': '100k'
    };

    const componentWithoutLPN = {
        'Mfr. Part #': 'RC0603FR-07100KL',
        'Value': '100k'
    };

    it('should lock "Mfr. Part #" field when LPN is assigned', () => {
        expect(isFieldLocked('Mfr. Part #', componentWithLPN)).toBe(true);
    });

    it('should lock "MPN" field when LPN is assigned', () => {
        expect(isFieldLocked('MPN', componentWithLPN)).toBe(true);
    });

    it('should lock "Part Number" field when LPN is assigned', () => {
        expect(isFieldLocked('Part Number', componentWithLPN)).toBe(true);
    });

    it('should lock "PartNumber" field when LPN is assigned', () => {
        expect(isFieldLocked('PartNumber', componentWithLPN)).toBe(true);
    });

    it('should lock "Part#" field when LPN is assigned', () => {
        expect(isFieldLocked('Part#', componentWithLPN)).toBe(true);
    });

    it('should not lock "Value" field', () => {
        expect(isFieldLocked('Value', componentWithLPN)).toBe(false);
    });

    it('should not lock other fields', () => {
        expect(isFieldLocked('Description', componentWithLPN)).toBe(false);
        expect(isFieldLocked('Footprint', componentWithLPN)).toBe(false);
        expect(isFieldLocked('Quantity', componentWithLPN)).toBe(false);
    });

    it('should not lock any field when no LPN is assigned', () => {
        expect(isFieldLocked('Mfr. Part #', componentWithoutLPN)).toBe(false);
        expect(isFieldLocked('MPN', componentWithoutLPN)).toBe(false);
        expect(isFieldLocked('Value', componentWithoutLPN)).toBe(false);
    });
});

describe('Complete LPN Workflow Integration', () => {
    it('should complete full LPN generation workflow', () => {
        const component = {
            'Designator': 'R101',
            'Mfr. Part #': 'RC0603FR-07100KL',
            'Value': '100k',
            'Footprint': '0603'
        };

        // 1. Validate component
        expect(validateComponentForLPN(component)).toBe(true);

        // 2. Check if LPN already exists
        expect(hasLPN(component)).toBe(false);

        // 3. Extract MPN
        const mpn = extractMPN(component);
        expect(mpn).toBe('RC0603FR-07100KL');

        // 4. Generate hash
        const hash = generateMPNHash(mpn);
        expect(hash).toHaveLength(6);
        expect(hash).toMatch(/^[0-9A-F]{6}$/);

        // 5. Simulate getting sequence number from Firestore
        const sequence = 123;

        // 6. Assemble LPN
        const lpn = assembleLPN(sequence, hash);
        expect(lpn).toMatch(/^KL-\d{5}-[0-9A-F]{6}$/);
        expect(lpn).toContain('-00123-');
        expect(lpn.endsWith(hash)).toBe(true);

        // 7. Assign LPN to component
        component.Local_Part_Number = lpn;

        // 8. Verify LPN is now detected
        expect(hasLPN(component)).toBe(true);

        // 9. Verify MPN field is now locked
        expect(isFieldLocked('Mfr. Part #', component)).toBe(true);

        // 10. Verify other fields are not locked
        expect(isFieldLocked('Value', component)).toBe(false);
        expect(isFieldLocked('Footprint', component)).toBe(false);
    });

    it('should generate consistent LPN for same component', () => {
        const mpn = 'RC0603FR-07100KL';
        const hash1 = generateMPNHash(mpn);
        const lpn1 = assembleLPN(123, hash1);

        const hash2 = generateMPNHash(mpn);
        const lpn2 = assembleLPN(123, hash2);

        expect(lpn1).toBe(lpn2);
    });

    it('should generate different LPNs for different sequences', () => {
        const mpn = 'RC0603FR-07100KL';
        const hash = generateMPNHash(mpn);
        
        const lpn1 = assembleLPN(1, hash);
        const lpn2 = assembleLPN(2, hash);

        expect(lpn1).not.toBe(lpn2);
        expect(lpn1).toContain('00001');
        expect(lpn2).toContain('00002');
    });

    it('should generate different LPNs for different MPNs', () => {
        const mpn1 = 'RC0603FR-07100KL';
        const mpn2 = 'STM32F407VGT6';
        
        const hash1 = generateMPNHash(mpn1);
        const hash2 = generateMPNHash(mpn2);
        
        const lpn1 = assembleLPN(123, hash1);
        const lpn2 = assembleLPN(123, hash2);

        expect(lpn1).not.toBe(lpn2);
    });
});