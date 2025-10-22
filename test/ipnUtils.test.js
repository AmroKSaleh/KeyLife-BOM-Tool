/**
 * @file ipnUtils.test.js
 * @description Unit tests for component type detection and IPN generation using the Vitest/Jest API.
 * * NOTE: For this test to run in a real Vite/Vitest environment, the relative path 
 * to ipnUtils.js must be correct.
 */

import { describe, it, expect } from 'vitest';
import { detectComponentType, generateIPN } from '../src/utils/ipnUtils';

// Mock configuration object for testing
const MOCK_CONFIG = { 
    designatorMeanings: { 
        'IC': 'Integrated Circuit', 
        'FB': 'Ferrite Bead',
        'K': 'Relay' // Custom entry
    } 
};

describe('detectComponentType', () => {
    it('should correctly identify standard passive components (Resistor)', () => {
        expect(detectComponentType('R10', MOCK_CONFIG.designatorMeanings)).toBe('Resistor');
    });

    it('should correctly identify standard active components (Integrated Circuit)', () => {
        expect(detectComponentType('U1', MOCK_CONFIG.designatorMeanings)).toBe('Integrated Circuit');
        expect(detectComponentType('IC5', MOCK_CONFIG.designatorMeanings)).toBe('Integrated Circuit');
    });

    it('should correctly identify custom components using the custom map', () => {
        // 'FB' is in the custom map
        expect(detectComponentType('FB1', MOCK_CONFIG.designatorMeanings)).toBe('Ferrite Bead');
        // 'K' is a custom entry only in the MOCK_CONFIG
        expect(detectComponentType('K1', MOCK_CONFIG.designatorMeanings)).toBe('Relay');
    });

    it('should return "Other" for unknown or non-prefixed designators', () => {
        expect(detectComponentType('SWAG1', MOCK_CONFIG.designatorMeanings)).toBe('Other');
        expect(detectComponentType('10R', MOCK_CONFIG.designatorMeanings)).toBe('Other');
        expect(detectComponentType('', MOCK_CONFIG.designatorMeanings)).toBe('Other');
        expect(detectComponentType(null, MOCK_CONFIG.designatorMeanings)).toBe('Other');
    });
});

describe('generateIPN', () => {
    // Component used for passive tests
    const RESISTOR_COMPONENT = {
        Designator: 'R2',
        Value: '1.5K',
        Footprint: '0402',
        Tolerance: '5%',
        'Mfr. Part #': 'CR0402JR-071K5L',
        'Mouser Part #': 'XXXX',
    };

    // Component used for active/complex tests
    const IC_COMPONENT = {
        Designator: 'U10',
        Value: 'Power Mgmt',
        'Mfr. Part #': 'TPS70933DRVR',
        'Manufacturer Part Number': 'TPS70933DRVR', // Alternate field present
        'Description': '3.3V LDO Regulator',
    };

    it('should generate a passive IPN using Value, Footprint, and Tolerance/Rating', () => {
        const ipn = generateIPN(RESISTOR_COMPONENT, MOCK_CONFIG);
        // R-15K_0402_5-CR0402JR071K5L
        expect(ipn).toMatch(/^R-15K_0402_5-CR0402JR071K5L/);
    });

    it('should handle different passive components (Capacitor)', () => {
        const capacitor = {
            Designator: 'C5',
            Value: '10nF',
            Footprint: '0805',
            Rating: '50V',
            'Mfr. Part #': 'C0805C103K5RAC',
        };
        const ipn = generateIPN(capacitor, MOCK_CONFIG);
        // C-10NF_0805_50V-C0805C103K5RAC
        expect(ipn).toMatch(/^C-10NF_0805_50V-C0805C103K5RAC/);
    });

    it('should generate an active IPN primarily using MPN', () => {
        const ipn = generateIPN(IC_COMPONENT, MOCK_CONFIG);
        // U-TPS70933DRVR-TPS70933DRVR
        expect(ipn).toMatch(/^U-TPS70933DRVR-TPS70933DRVR/);
    });

    it('should handle components with alternative MPN field names', () => {
        const diode = {
            Designator: 'D1',
            Value: 'Schottky',
            'Manufacturer Part Number': 'BAT54S-V',
        };
        const ipn = generateIPN(diode, MOCK_CONFIG);
        // D-BAT54S-V-BAT54S-V
        expect(ipn).toMatch(/^D-BAT54S-V-BAT54S-V/);
    });

    it('should use NO_MPN if Mfr. Part # is missing and fall back to Value/Description', () => {
        const testpoint = {
            Designator: 'TP1',
            Value: '1mm-Pin',
            Description: 'Test point',
        };
        const ipn = generateIPN(testpoint, MOCK_CONFIG);
        // TP-1MMPIN-NO_MPN
        expect(ipn).toMatch(/^TP-1MMPIN-NO_MPN/);
    });

    it('should sanitize the essential value string', () => {
        const messyCapacitor = {
            Designator: 'C100',
            Value: '47uF, 10% (0.1 uF)',
            Footprint: '1210-2',
            'Mfr. Part #': 'GRM31CC71A476KE15L'
        };
        const ipn = generateIPN(messyCapacitor, MOCK_CONFIG);
        // C-47UF_10_01UF_1210_2_-GRM31CC71A476KE15L
        // The regex replaces special characters with '_' and collapses them
        expect(ipn).toMatch(/^C-47UF_10_01UF_1210_2-GRM31CC71A476KE15L/);
    });
});
