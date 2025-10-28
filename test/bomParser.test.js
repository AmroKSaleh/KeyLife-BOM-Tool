/**
 * @file bomParser.test.js
 * @description Test suite for BOM parser utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    findDesignatorColumn,
    normalizeComponent,
    flattenBOM,
    parseCSV,
    // parseExcel // Add if/when testing
    // processBOMFile // Add if/when testing
} from '../src/utils/bomParser.js';

// Mock config used by the functions under test
const mockConfig = {
    designatorColumn: 'Designator',
    alternateDesignatorColumns: ['Reference', 'RefDes', 'Ref'],
    fieldMappings: {
        'Part Number': 'Mfr. Part #', 'MPN': 'Mfr. Part #',
        'Reference': 'Designator', 'RefDes': 'Designator', 'Ref': 'Designator',
        'Qty': 'Quantity', 'Package': 'Footprint'
    }
};

describe('BOM Parser Utilities', () => { // Top-level describe

    describe('findDesignatorColumn', () => {
        it('should find primary designator column', () => {
            const headers = ['Designator', 'Value', 'Footprint'];
            expect(findDesignatorColumn(headers, mockConfig)).toBe('Designator');
        });
        it('should find alternate designator column', () => {
            const headers = ['Reference', 'Value', 'Footprint'];
            expect(findDesignatorColumn(headers, mockConfig)).toBe('Reference');
        });
        it('should prioritize primary over alternates', () => {
            const headers = ['Designator', 'Reference', 'Value'];
            expect(findDesignatorColumn(headers, mockConfig)).toBe('Designator');
        });
        it('should return null when no designator column found', () => {
            const headers = ['Value', 'Footprint', 'Description'];
            expect(findDesignatorColumn(headers, mockConfig)).toBeNull();
        });
        it('should find first matching alternate in order', () => {
            const headers = ['RefDes', 'Reference', 'Value'];
            expect(findDesignatorColumn(headers, mockConfig)).toBe('Reference');
        });
         it('should handle null or undefined inputs gracefully', () => {
            expect(findDesignatorColumn(null, mockConfig)).toBeNull();
            expect(findDesignatorColumn(['Designator'], null)).toBeNull();
            expect(findDesignatorColumn(['Designator'], { designatorColumn: 'D' })).toBeNull(); // Config missing alternates
            expect(findDesignatorColumn(['Ref'], { designatorColumn: 'D', alternateDesignatorColumns: null })).toBeNull();
        });
    });

    describe('normalizeComponent', () => {
        it('should map designator field to standard name', () => {
            const component = { 'Reference': 'R1', 'Value': '100k' };
            const result = normalizeComponent(component, mockConfig, 'Reference');
            expect(result.Designator).toBe('R1');
            expect(result.Reference).toBe('R1');
        });
        it('should apply field mappings', () => {
            const component = { 'Designator': 'R1', 'Part Number': 'PN123', 'Package': '0603' };
            const result = normalizeComponent(component, mockConfig, 'Designator');
            expect(result['Mfr. Part #']).toBe('PN123');
            expect(result.Footprint).toBe('0603');
        });
        it('should not overwrite existing mapped fields', () => {
            const component = { 'Designator': 'R1', 'Mfr. Part #': 'ORIGINAL', 'Part Number': 'IGNORE' };
            const result = normalizeComponent(component, mockConfig, 'Designator');
            expect(result['Mfr. Part #']).toBe('ORIGINAL');
        });
        it('should preserve unmapped fields', () => {
            const component = { 'Designator': 'R1', 'Custom': 'Val', 'Desc': 'Test' };
            const result = normalizeComponent(component, mockConfig, 'Designator');
            expect(result.Custom).toBe('Val');
            expect(result.Desc).toBe('Test');
            expect(result.Description).toBeUndefined();
        });
        it('should handle null or undefined inputs gracefully', () => {
            expect(normalizeComponent(null, mockConfig, 'Designator')).toBeNull();
            expect(normalizeComponent({ D: 'R1'}, null, 'D')).toEqual({ D: 'R1'});
            expect(normalizeComponent({ D: 'R1'}, { fieldMappings: null }, 'D')).toEqual({ D: 'R1', Designator: 'R1'});
        });
    });

    describe('flattenBOM', () => {
        const projectName = 'TestProject';
        const headers = ['Designator', 'Value', 'Footprint'];
        const headersWithQty = ['Designator', 'Value', 'Footprint', 'Qty'];
        const expectedEmptyResult = { flattened: [], ambiguous: [] };

        it('should flatten single designator', () => {
            const rows = [{ 'Designator': 'R1', 'Value': '100k' }];
            const result = flattenBOM(rows, headers, projectName, 'Designator');
            expect(result.flattened).toHaveLength(1);
            expect(result.flattened[0].Designator).toBe('R1');
            expect(result.ambiguous).toHaveLength(0);
        });
        it('should flatten comma-separated designators when no Qty column', () => {
            const rows = [{ 'Designator': 'R1, R2, R3', 'Value': '100k' }];
            const result = flattenBOM(rows, headers, projectName, 'Designator');
            expect(result.flattened).toHaveLength(3);
            expect(result.flattened.map(c => c.Designator)).toEqual(['R1', 'R2', 'R3']);
            expect(result.ambiguous).toHaveLength(0);
        });
        
        // --- NEW AMBIGUITY TEST (Fix for failing original test) ---
        it('should detect ambiguous component and return it as ambiguous when Qty column exists and Qty > 1', () => {
            const rows = [{ 'Designator': 'R1, R2, R3', 'Value': '100k', 'Qty': 3 }];
            const result = flattenBOM(rows, headersWithQty, projectName, 'Designator');
            expect(result.flattened).toHaveLength(0);
            expect(result.ambiguous).toHaveLength(1);
            expect(result.ambiguous[0].Designator).toBe('R1, R2, R3');
            expect(result.ambiguous[0].Qty).toBe(3);
            expect(result.ambiguous[0]._ambiguousQty).toBe(true);
        });
        
        it('should flatten space-separated designators when no Qty column', () => {
            const rows = [{ 'Designator': 'C1 C2 C3', 'Value': '10uF' }];
            const result = flattenBOM(rows, headers, projectName, 'Designator');
            expect(result.flattened).toHaveLength(3);
            expect(result.flattened.map(c => c.Designator)).toEqual(['C1', 'C2', 'C3']);
            expect(result.ambiguous).toHaveLength(0);
        });
        it('should flatten semicolon-separated designators when no Qty column', () => {
            const rows = [{ 'Designator': 'D1; D2; D3', 'Value': '1N4148' }];
            const result = flattenBOM(rows, headers, projectName, 'Designator');
            expect(result.flattened).toHaveLength(3);
            expect(result.flattened.map(c => c.Designator)).toEqual(['D1', 'D2', 'D3']);
            expect(result.ambiguous).toHaveLength(0);
        });
        it('should handle mixed separators (including spaces) when no Qty column', () => {
            const rows = [{ 'Designator': 'R1, R2 R3; R4', 'Value': '1k' }];
            const result = flattenBOM(rows, headers, projectName, 'Designator');
            expect(result.flattened).toHaveLength(4);
            expect(result.flattened.map(c => c.Designator)).toEqual(['R1', 'R2', 'R3', 'R4']);
            expect(result.ambiguous).toHaveLength(0);
        });
        it('should skip rows with empty designators', () => {
            const rows = [{ 'Designator': '', 'Value': '100k' }, { 'Designator': 'R1', 'Value': '10k' }];
            const result = flattenBOM(rows, headers, projectName, 'Designator');
            expect(result.flattened).toHaveLength(1);
            expect(result.flattened[0].Designator).toBe('R1');
            expect(result.ambiguous).toHaveLength(0);
        });
        it('should generate unique IDs for each component', () => {
            const rows = [{ 'Designator': 'R1, R2', 'Value': '100k' }];
            const result = flattenBOM(rows, headers, projectName, 'Designator');
            expect(result.flattened[0].id).toBeTruthy();
            expect(result.flattened[1].id).toBeTruthy();
            expect(result.flattened[0].id).not.toBe(result.flattened[1].id);
            expect(result.ambiguous).toHaveLength(0);
        });
        it('should copy all fields to each flattened component', () => {
            const rows = [{ 'Designator': 'R1, R2', 'Value': '100k', 'Desc': 'Test' }];
            const result = flattenBOM(rows, ['Designator', 'Value', 'Desc'], projectName, 'Designator');
            expect(result.flattened[0].Desc).toBe('Test');
            expect(result.flattened[1].Desc).toBe('Test');
            expect(result.ambiguous).toHaveLength(0);
        });
        it('should handle null or undefined inputs gracefully', () => {
            // Updated expectation to match the new return structure
            expect(flattenBOM(null, headers, 'P1', 'D')).toEqual(expectedEmptyResult);
            expect(flattenBOM([], headers, 'P1', 'D')).toEqual(expectedEmptyResult);
            expect(flattenBOM([{D:'R1'}], null, 'P1', 'D')).toEqual(expectedEmptyResult); 
            expect(flattenBOM([{D:'R1'}], headers, null, 'D')).toEqual(expectedEmptyResult); 
            expect(flattenBOM([{D:'R1'}], headers, 'P1', null)).toEqual(expectedEmptyResult); 
        });
    });

    describe('parseCSV', () => {
        it('should parse simple CSV', () => {
            const csv = `Designator,Value,Footprint\nR1,100k,0603\nR2,10k,0603`;
            const result = parseCSV(csv);
            expect(result.rawHeaders).toEqual(['Designator', 'Value', 'Footprint']);
            expect(result.rawRows).toHaveLength(2);
            expect(result.rawRows[0]).toEqual({ Designator: 'R1', Value: '100k', Footprint: '0603' });
        });
        it('should handle quoted values', () => {
            const csv = `Designator,Value,Description\nR1,100k,"Test, with comma"`;
            const result = parseCSV(csv);
            expect(result.rawRows[0].Description).toBe('Test, with comma');
        });
        it('should handle escaped quotes', () => {
            const csv = `Designator,Value,Description\nR1,100k,"Test ""quoted"" value"`;
            const result = parseCSV(csv);
            expect(result.rawRows[0].Description).toBe('Test "quoted" value');
        });
        it('should skip empty rows', () => {
            const csv = `Designator,Value,Footprint\nR1,100k,0603\n\nR2,10k,0603\n   \n`;
            const result = parseCSV(csv);
            expect(result.rawRows).toHaveLength(2);
        });
        it('should trim whitespace from headers and values', () => {
            const csv = ` Designator , Value , Footprint \n R1 , 100k , 0603 `;
            const result = parseCSV(csv);
            expect(result.rawHeaders).toEqual(['Designator', 'Value', 'Footprint']);
            expect(result.rawRows[0]).toEqual({ Designator: 'R1', Value: '100k', Footprint: '0603' });
        });
        it('should throw error for empty CSV', () => {
            expect(() => parseCSV('')).toThrow('CSV file is empty');
            expect(() => parseCSV('  \n  ')).toThrow('CSV file is empty');
        });
        it('should throw error for CSV with no valid headers', () => {
            expect(() => parseCSV('\n,,,\n1,2,3')).toThrow('CSV file has no valid headers');
            expect(() => parseCSV('"", "", ""\n1,2,3')).toThrow('CSV file has no valid headers');
            expect(() => parseCSV(' \t ,   , \n1,2,3')).toThrow('CSV file has no valid headers');
        });
        it('should handle missing values at end of line', () => {
            const csv = `Designator,Value,Footprint\nR1,100k\nR2,,0402`; // R1 is missing Footprint
            const result = parseCSV(csv);
            expect(result.rawRows).toHaveLength(2);
            expect(result.rawRows[0]).toEqual({ Designator: 'R1', Value: '100k', Footprint: '' }); // Footprint should be empty string
            expect(result.rawRows[1]).toEqual({ Designator: 'R2', Value: '', Footprint: '0402' });
        });
         it('should handle lines with fewer columns than header', () => {
            const csv = `H1,H2,H3\nV1,V2\nV4`;
            const result = parseCSV(csv);
            expect(result.rawRows[0]).toEqual({ H1: 'V1', H2: 'V2', H3: '' });
            expect(result.rawRows[1]).toEqual({ H1: 'V4', H2: '', H3: '' });
        });
         it('should handle lines with more columns than header', () => {
            const csv = `H1,H2\nV1,V2,V3\nV4`;
            const result = parseCSV(csv);
            expect(result.rawHeaders).toEqual(['H1', 'H2']); // Only headers are kept
            expect(result.rawRows[0]).toEqual({ H1: 'V1', H2: 'V2' }); // Extra value V3 is ignored
            expect(result.rawRows[1]).toEqual({ H1: 'V4', H2: '' });
        });
    });
});