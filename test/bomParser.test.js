/**
 * @file bomParser.test.js
 * @description Test suite for BOM parser utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    findDesignatorColumn,
    normalizeComponent,
    flattenBOM,
    parseCSV
} from '../src/utils/bomParser.js';

const mockConfig = {
    designatorColumn: 'Designator',
    alternateDesignatorColumns: ['Reference', 'RefDes', 'Ref'],
    fieldMappings: {
        'Part Number': 'Mfr. Part #',
        'MPN': 'Mfr. Part #',
        'Reference': 'Designator',
        'Qty': 'Quantity',
        'Package': 'Footprint'
    }
};

describe('findDesignatorColumn', () => {
    it('should find primary designator column', () => {
        const headers = ['Designator', 'Value', 'Footprint'];
        const result = findDesignatorColumn(headers, mockConfig);
        expect(result).toBe('Designator');
    });

    it('should find alternate designator column', () => {
        const headers = ['Reference', 'Value', 'Footprint'];
        const result = findDesignatorColumn(headers, mockConfig);
        expect(result).toBe('Reference');
    });

    it('should prioritize primary over alternates', () => {
        const headers = ['Designator', 'Reference', 'Value'];
        const result = findDesignatorColumn(headers, mockConfig);
        expect(result).toBe('Designator');
    });

    it('should return null when no designator column found', () => {
        const headers = ['Value', 'Footprint', 'Description'];
        const result = findDesignatorColumn(headers, mockConfig);
        expect(result).toBeNull();
    });

    it('should find first matching alternate in order', () => {
        const headers = ['RefDes', 'Reference', 'Value'];
        const result = findDesignatorColumn(headers, mockConfig);
        expect(result).toBe('Reference');
    });
});

describe('normalizeComponent', () => {
    it('should map designator field to standard name', () => {
        const component = {
            'Reference': 'R1',
            'Value': '100k',
            'Footprint': '0603'
        };
        const result = normalizeComponent(component, mockConfig, 'Reference');
        
        expect(result.Designator).toBe('R1');
        expect(result.Reference).toBe('R1');
    });

    it('should apply field mappings', () => {
        const component = {
            'Designator': 'R1',
            'Part Number': 'RC0603FR-07100KL',
            'Package': '0603'
        };
        const result = normalizeComponent(component, mockConfig, 'Designator');
        
        expect(result['Mfr. Part #']).toBe('RC0603FR-07100KL');
        expect(result.Footprint).toBe('0603');
    });

    it('should not overwrite existing mapped fields', () => {
        const component = {
            'Designator': 'R1',
            'Mfr. Part #': 'ORIGINAL',
            'Part Number': 'SHOULD_NOT_OVERRIDE'
        };
        const result = normalizeComponent(component, mockConfig, 'Designator');
        
        expect(result['Mfr. Part #']).toBe('ORIGINAL');
    });

    it('should preserve unmapped fields', () => {
        const component = {
            'Designator': 'R1',
            'CustomField': 'CustomValue',
            'Description': 'Test resistor'
        };
        const result = normalizeComponent(component, mockConfig, 'Designator');
        
        expect(result.CustomField).toBe('CustomValue');
        expect(result.Description).toBe('Test resistor');
    });
});

describe('flattenBOM', () => {
    const projectName = 'TestProject';
    const headers = ['Designator', 'Value', 'Footprint'];

    it('should flatten single designator', () => {
        const rows = [
            { 'Designator': 'R1', 'Value': '100k', 'Footprint': '0603' }
        ];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result).toHaveLength(1);
        expect(result[0].Designator).toBe('R1');
        expect(result[0].Value).toBe('100k');
        expect(result[0].ProjectName).toBe('TestProject');
    });

    it('should flatten comma-separated designators', () => {
        const rows = [
            { 'Designator': 'R1, R2, R3', 'Value': '100k', 'Footprint': '0603' }
        ];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result).toHaveLength(3);
        expect(result[0].Designator).toBe('R1');
        expect(result[1].Designator).toBe('R2');
        expect(result[2].Designator).toBe('R3');
        expect(result[0].Value).toBe('100k');
        expect(result[1].Value).toBe('100k');
        expect(result[2].Value).toBe('100k');
    });

    it('should flatten space-separated designators', () => {
        const rows = [
            { 'Designator': 'C1 C2 C3', 'Value': '10uF', 'Footprint': '0805' }
        ];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result).toHaveLength(3);
        expect(result[0].Designator).toBe('C1');
        expect(result[1].Designator).toBe('C2');
        expect(result[2].Designator).toBe('C3');
    });

    it('should flatten semicolon-separated designators', () => {
        const rows = [
            { 'Designator': 'D1; D2; D3', 'Value': '1N4148', 'Footprint': 'SOD-123' }
        ];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result).toHaveLength(3);
        expect(result[0].Designator).toBe('D1');
        expect(result[1].Designator).toBe('D2');
        expect(result[2].Designator).toBe('D3');
    });

    it('should handle mixed separators', () => {
        const rows = [
            { 'Designator': 'R1, R2 R3; R4', 'Value': '1k', 'Footprint': '0603' }
        ];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result).toHaveLength(4);
        expect(result.map(c => c.Designator)).toEqual(['R1', 'R2', 'R3', 'R4']);
    });

    it('should skip rows with empty designators', () => {
        const rows = [
            { 'Designator': '', 'Value': '100k', 'Footprint': '0603' },
            { 'Designator': 'R1', 'Value': '100k', 'Footprint': '0603' }
        ];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result).toHaveLength(1);
        expect(result[0].Designator).toBe('R1');
    });

    it('should generate unique IDs for each component', () => {
        const rows = [
            { 'Designator': 'R1, R2', 'Value': '100k', 'Footprint': '0603' }
        ];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result[0].id).toBeTruthy();
        expect(result[1].id).toBeTruthy();
        expect(result[0].id).not.toBe(result[1].id);
    });

    it('should copy all fields to each flattened component', () => {
        const rows = [
            { 
                'Designator': 'R1, R2', 
                'Value': '100k', 
                'Footprint': '0603',
                'Description': 'Test resistor',
                'Manufacturer': 'Yageo'
            }
        ];
        const headers = ['Designator', 'Value', 'Footprint', 'Description', 'Manufacturer'];
        const result = flattenBOM(rows, headers, projectName, 'Designator');
        
        expect(result[0].Description).toBe('Test resistor');
        expect(result[0].Manufacturer).toBe('Yageo');
        expect(result[1].Description).toBe('Test resistor');
        expect(result[1].Manufacturer).toBe('Yageo');
    });
});

describe('parseCSV', () => {
    it('should parse simple CSV', () => {
        const csv = `Designator,Value,Footprint
R1,100k,0603
R2,10k,0603`;
        
        const result = parseCSV(csv);
        
        expect(result.rawHeaders).toEqual(['Designator', 'Value', 'Footprint']);
        expect(result.rawRows).toHaveLength(2);
        expect(result.rawRows[0]).toEqual({ Designator: 'R1', Value: '100k', Footprint: '0603' });
    });

    it('should handle quoted values', () => {
        const csv = `Designator,Value,Description
R1,100k,"Test, with comma"`;
        
        const result = parseCSV(csv);
        
        expect(result.rawRows[0].Description).toBe('Test, with comma');
    });

    it('should handle escaped quotes', () => {
        const csv = `Designator,Value,Description
R1,100k,"Test ""quoted"" value"`;
        
        const result = parseCSV(csv);
        
        expect(result.rawRows[0].Description).toBe('Test "quoted" value');
    });

    it('should skip empty rows', () => {
        const csv = `Designator,Value,Footprint
R1,100k,0603

R2,10k,0603`;
        
        const result = parseCSV(csv);
        
        expect(result.rawRows).toHaveLength(2);
    });

    it('should trim whitespace', () => {
        const csv = `Designator , Value , Footprint
 R1 , 100k , 0603 `;
        
        const result = parseCSV(csv);
        
        expect(result.rawHeaders).toEqual(['Designator', 'Value', 'Footprint']);
        expect(result.rawRows[0].Designator).toBe('R1');
        expect(result.rawRows[0].Value).toBe('100k');
    });

    it('should throw error for empty CSV', () => {
        expect(() => parseCSV('')).toThrow('CSV file is empty');
    });

    it('should throw error for CSV with no headers', () => {
        expect(() => parseCSV('\n\n')).toThrow('CSV file is empty');
    });

    it('should handle missing values', () => {
        const csv = `Designator,Value,Footprint
R1,,0603`;
        
        const result = parseCSV(csv);
        
        expect(result.rawRows[0].Value).toBe('');
        expect(result.rawRows[0].Footprint).toBe('0603');
    });
});