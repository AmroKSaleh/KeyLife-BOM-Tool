/**
 * @file bomParser.js
 * @description Utility functions for parsing BOM files (CSV, Excel)
 */

import ExcelJS from 'exceljs';

/**
 * Find designator column in headers
 */
export function findDesignatorColumn(headers, config) {
    // Try primary column first
    if (headers.includes(config.designatorColumn)) {
        return config.designatorColumn;
    }

    // Try alternates
    for (const alt of config.alternateDesignatorColumns) {
        if (headers.includes(alt)) {
            return alt;
        }
    }

    return null;
}

/**
 * Normalize component data (map fields to standard names)
 */
export function normalizeComponent(component, config, designatorColumn) {
    const normalized = { ...component };

    // Map designator to standard name
    if (designatorColumn && designatorColumn !== 'Designator') {
        normalized.Designator = component[designatorColumn];
    }

    // Apply field mappings
    Object.entries(config.fieldMappings).forEach(([from, to]) => {
        if (component[from] && !component[to]) {
            normalized[to] = component[from];
        }
    });

    return normalized;
}

/**
 * Flatten BOM data into individual component entries
 * Handles consolidated designators like "R1, R2, R3" or "C1 C2 C3"
 * Only flattens if multiple designators found AND no quantity column exists
 */
export function flattenBOM(rawRows, rawHeaders, projectName, designatorColumn) {
    const flattenedComponents = [];
    let rowCounter = 0;

    // Check if BOM has a quantity column (case-insensitive)
    const qtyColumn = rawHeaders.find(h => 
        /^(qty|quantity|qnt|count|amount)$/i.test(h.trim())
    );
    const hasQuantityColumn = !!qtyColumn;

    for (const rawRow of rawRows) {
        // Use the column identified as the Designator source
        const designatorString = String(rawRow[designatorColumn] || '');

        if (!designatorString.trim()) {
            continue;
        }

        // Check if designator contains multiple items (comma or semicolon separated)
        const hasMultipleDesignators = /[,;]/.test(designatorString);

        // Only flatten if there are multiple designators AND no quantity column
        const shouldFlatten = hasMultipleDesignators && !hasQuantityColumn;

        if (shouldFlatten) {
            // Split by comma or semicolon only
            const designators = designatorString.split(/[,;]\s*/).filter(d => d.trim() !== '');

            // Create a new component object for every single designator
            for (const designator of designators) {
                if (!designator) continue;

                const componentId = `${projectName}-${designator}-${Date.now()}-${rowCounter++}`;

                const componentData = {
                    id: componentId,
                    ProjectName: projectName,
                };

                // Copy all column data
                for (const header of rawHeaders) {
                    if (header === designatorColumn) {
                        componentData[header] = designator; // Individual designator
                    } else {
                        componentData[header] = rawRow[header] || '';
                    }
                }

                flattenedComponents.push(componentData);
            }
        } else {
            // Don't flatten - keep as single component
            const componentId = `${projectName}-${designatorString.trim()}-${Date.now()}-${rowCounter++}`;

            const componentData = {
                id: componentId,
                ProjectName: projectName,
            };

            // Copy all column data as-is
            for (const header of rawHeaders) {
                componentData[header] = rawRow[header] || '';
            }

            flattenedComponents.push(componentData);
        }
    }

    return flattenedComponents;
}

/**
 * Parse CSV text into rows and headers
 */
export function parseCSV(text) {
    if (!text || !text.trim()) {
        throw new Error('CSV file is empty');
    }

    const lines = text.trim().split('\n');
    
    if (lines.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Parse header row
    const rawHeaders = parseCsvLine(lines[0]).map(h => h.trim()).filter(h => h);

    if (rawHeaders.length === 0) {
        throw new Error('CSV file has no headers');
    }

    // Parse data rows
    const rawRows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        
        // Skip empty rows
        if (values.every(v => !v.trim())) {
            continue;
        }

        const row = {};
        rawHeaders.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });

        rawRows.push(row);
    }

    return { rawHeaders, rawRows };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);

    return values;
}

/**
 * Parse Excel buffer into rows and headers
 */
export async function parseExcel(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
        throw new Error('Excel file has no worksheets');
    }

    // Extract headers from first row
    const rawHeaders = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
        if (cell.value) {
            rawHeaders.push(String(cell.value).trim());
        }
    });

    if (rawHeaders.length === 0) {
        throw new Error('Excel file has no headers');
    }

    // Extract data rows
    const rawRows = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowObject = {};
        let isEmpty = true;

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = rawHeaders[colNumber - 1];
            if (header) {
                const value = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
                rowObject[header] = value.trim();
                if (value.trim()) isEmpty = false;
            }
        });

        if (!isEmpty) {
            rawRows.push(rowObject);
        }
    });

    return { rawHeaders, rawRows };
}

/**
 * Process BOM file and return flattened components
 */
export async function processBOMFile(file, projectName, config) {
    if (!projectName || !projectName.trim()) {
        throw new Error('Project name is required');
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    let rawHeaders, rawRows;

    // Parse file based on extension
    if (extension === 'csv') {
        const text = await file.text();
        const parsed = parseCSV(text);
        rawHeaders = parsed.rawHeaders;
        rawRows = parsed.rawRows;
    } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const parsed = await parseExcel(buffer);
        rawHeaders = parsed.rawHeaders;
        rawRows = parsed.rawRows;
    } else {
        throw new Error('Unsupported file format. Please upload .csv, .xls, or .xlsx file.');
    }

    // Find designator column
    const designatorColumn = findDesignatorColumn(rawHeaders, config);
    if (!designatorColumn) {
        throw new Error(
            `Could not find designator column. Expected one of: ${[config.designatorColumn, ...config.alternateDesignatorColumns].join(', ')}`
        );
    }

    // Flatten BOM data
    const flattenedComponents = flattenBOM(rawRows, rawHeaders, projectName, designatorColumn);

    // Normalize components
    const normalizedComponents = flattenedComponents.map(comp =>
        normalizeComponent(comp, config, designatorColumn)
    );

    // Extract unique headers
    const headersSet = new Set(['ProjectName']);
    normalizedComponents.forEach(comp => {
        Object.keys(comp).forEach(key => {
            if (key !== 'id') {
                headersSet.add(key);
            }
        });
    });

    const headers = ['ProjectName', ...Array.from(headersSet).filter(h => h !== 'ProjectName')];

    return {
        components: normalizedComponents,
        headers,
        count: normalizedComponents.length
    };
}