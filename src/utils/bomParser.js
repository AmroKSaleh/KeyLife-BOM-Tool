/**
 * @file bomParser.js
 * @description Utility functions for parsing BOM files (CSV, Excel)
 */

import ExcelJS from 'exceljs';

export function findDesignatorColumn(headers, config) {
    if (!headers || !config) return null;
    if (headers.includes(config.designatorColumn)) return config.designatorColumn;
    for (const alt of config.alternateDesignatorColumns || []) {
        if (headers.includes(alt)) return alt;
    }
    return null;
}

export function normalizeComponent(component, config, designatorColumn) {
    if (!component || !config) return component;
    const normalized = { ...component };
    if (designatorColumn && designatorColumn !== 'Designator' && component[designatorColumn]) {
        normalized.Designator = component[designatorColumn];
    }
    Object.entries(config.fieldMappings || {}).forEach(([from, to]) => {
        if (component[from] && !component[to]) normalized[to] = component[from];
    });
    return normalized;
}

/**
 * Processes BOM rows. It flattens rows with multiple designators if no quantity
 * column exists or if the quantity is <= 1. Rows with multiple designators AND
 * quantity > 1 are flagged as ambiguous.
 *
 * @param {Array<object>} rawRows - Array of row objects from the parsed file.
 * @param {Array<string>} rawHeaders - Array of header strings.
 * @param {string} projectName - The name of the project.
 * @param {string} designatorColumn - The identified designator column name.
 * @returns {Array<object>} Array of processed component objects. Ambiguous rows
 * will have `_ambiguousQty: true` and `_potentialDesignators: [...]`.
 */
export function flattenBOM(rawRows, rawHeaders, projectName, designatorColumn) {
    if (!rawRows || !rawHeaders || !projectName || !designatorColumn) return [];
    const processedComponents = []; // Renamed from flattenedComponents
    let rowCounter = 0;
    const qtyColumn = rawHeaders.find(h => /^(qty|quantity|qnt|count|amount)$/i.test(h?.trim() || ''));

    for (const rawRow of rawRows) {
        if (!rawRow) continue;
        const designatorString = String(rawRow[designatorColumn] || '');
        if (!designatorString.trim()) continue;

        const separatorsRegex = /[,;]\s*|\s+/;
        const potentialDesignators = designatorString.split(separatorsRegex).filter(d => d && d.trim() !== '');
        const hasMultipleDesignators = potentialDesignators.length > 1;

        let shouldFlatten = false;
        let isAmbiguous = false; // Flag for ambiguous rows

        if (hasMultipleDesignators) {
            if (!qtyColumn) {
                // Flatten if no quantity column exists
                shouldFlatten = true;
            } else {
                const qtyValue = rawRow[qtyColumn];
                const parsedQty = parseInt(String(qtyValue).trim(), 10);
                if (isNaN(parsedQty) || parsedQty <= 1) {
                    // Flatten if quantity is 1 or invalid
                    shouldFlatten = true;
                } else {
                    // --- AMBIGUOUS CASE ---
                    // Multiple designators AND quantity > 1
                    isAmbiguous = true;
                    shouldFlatten = false; // Don't flatten here, flag it instead
                }
            }
        }

        if (shouldFlatten) {
            // Flatten: Create one entry per designator
            for (const designator of potentialDesignators) {
                const componentId = `${projectName}-${designator}-${Date.now()}-${rowCounter++}`;
                const componentData = { id: componentId, ProjectName: projectName };
                for (const header of rawHeaders) {
                    if (header === designatorColumn) {
                        componentData[header] = designator;
                    } else if (header === qtyColumn) {
                        componentData[header] = '1'; // Explicitly set qty to 1
                    } else {
                        componentData[header] = rawRow[header] || '';
                    }
                }
                processedComponents.push(componentData);
            }
        } else {
            // Don't flatten OR handle ambiguous case: Create a single entry
            const componentId = `${projectName}-${designatorString.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}-${rowCounter++}`;
            const componentData = { id: componentId, ProjectName: projectName };
            for (const header of rawHeaders) {
                componentData[header] = rawRow[header] || '';
            }

            // --- ADD AMBIGUOUS FLAG ---
            if (isAmbiguous) {
                componentData._ambiguousQty = true;
                componentData._potentialDesignators = potentialDesignators; // Store the individual designators found
                 // Store original qty and column name for reference in resolution modal
                componentData._originalQty = rawRow[qtyColumn];
                componentData._qtyColumnName = qtyColumn;
            }
            // --- END ADD AMBIGUOUS FLAG ---

            processedComponents.push(componentData);
        }
    }
    return processedComponents; // Return all processed components, including flagged ones
}

/**
 * Parse CSV text into rows and headers, skipping initial blank lines.
 */
export function parseCSV(text) {
    if (!text || !text.trim()) {
        throw new Error('CSV file is empty');
    }

    const lines = text.trim().split('\n');
    let headerLineIndex = -1;
    let rawHeaders = [];

    // Find the first non-empty line to use as header
    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (trimmedLine) {
            // Parse the first non-empty line
            const potentialHeaders = parseCsvLine(trimmedLine).map(h => h.trim());
            // Filter out empty strings AFTER checking if the line itself had content
            rawHeaders = potentialHeaders.filter(h => h);

            // If the first non-empty line yielded no headers, throw error
            if (rawHeaders.length === 0) {
                 throw new Error('CSV file has no valid headers');
            }

            // Otherwise, we found our header line
            headerLineIndex = i;
            break;
        }
    }

    // This check might be redundant now but kept for safety
    if (headerLineIndex === -1) {
        throw new Error('CSV file has no valid headers');
    }

    // Parse data rows starting from the line after the header
    const rawRows = [];
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.every(v => !v?.trim())) continue; // Skip rows that are completely empty

        const row = {};
        rawHeaders.forEach((header, index) => {
            row[header] = values[index] !== undefined ? values[index].trim() : '';
        });
        rawRows.push(row);
    }

    return { rawHeaders, rawRows };
}

/**
 * Parse a single CSV line handling quoted values and trimming results.
 */
function parseCsvLine(line) {
    if (typeof line !== 'string') return []; // Handle non-string input gracefully
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i]; const nextChar = line[i + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) { values.push(current); current = ''; } else { current += char; }
    }
    values.push(current);
    // Trim values AFTER parsing, remove surrounding quotes if they exist
    return values.map(v => (v || '').trim().replace(/^"|"$/g, '').trim());
}

export async function parseExcel(buffer) {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(buffer);
    } catch (e) {
        throw new Error(`Failed to load Excel file: ${e.message}`);
    }
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('Excel file has no worksheets');

    const rawHeaders = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => { // includeEmpty might help
        rawHeaders.push(String(cell.value || '').trim()); // Ensure string conversion
    });
    // Filter out completely empty header cells AFTER processing the row
    const validHeaders = rawHeaders.filter(h => h);
    if (validHeaders.length === 0) throw new Error('Excel file has no valid headers in the first row');

    const rawRows = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const rowObject = {}; let isEmpty = true;
        validHeaders.forEach((header, index) => { // Iterate using validHeaders index
             // Get cell by original column index (index + 1)
             const cell = row.getCell(rawHeaders.indexOf(header) + 1);
             const value = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
             rowObject[header] = value.trim();
             if (value.trim()) isEmpty = false;
        });
        if (!isEmpty) rawRows.push(rowObject);
    });
    return { rawHeaders: validHeaders, rawRows }; // Return only valid headers
}

/**
 * Processes a BOM file (CSV or Excel).
 *
 * @param {File} file - The file object.
 * @param {string} projectName - The name of the project.
 * @param {object} config - The application configuration object.
 * @returns {Promise<object>} An object containing:
 * - `validComponents`: Array of components ready for import.
 * - `ambiguousComponents`: Array of components needing quantity resolution.
 * - `headers`: Array of all detected headers.
 * - `count`: Total number of original rows processed (excluding header).
 */
export async function processBOMFile(file, projectName, config) {
    if (!projectName || !projectName.trim()) throw new Error('Project name is required');
    if (!file) throw new Error('No file provided');
    if (!config) throw new Error('Configuration is missing');

    const extension = file.name?.split('.').pop()?.toLowerCase();
    let rawHeaders, rawRows;

    try {
        if (extension === 'csv') {
            const text = await file.text();
            ({ rawHeaders, rawRows } = parseCSV(text));
        } else if (extension === 'xlsx' || extension === 'xls') {
            const buffer = await file.arrayBuffer();
            ({ rawHeaders, rawRows } = await parseExcel(buffer));
        } else {
            throw new Error('Unsupported file format. Please upload .csv, .xls, or .xlsx file.');
        }
    } catch (parseError) {
        throw new Error(`Error parsing file "${file.name}": ${parseError.message}`);
    }

    const designatorColumn = findDesignatorColumn(rawHeaders, config);
    if (!designatorColumn) {
        throw new Error(`Could not find designator column in "${file.name}". Expected one of: ${[config.designatorColumn, ...(config.alternateDesignatorColumns || [])].join(', ')}`);
    }

    // Process all rows, flagging ambiguous ones
    const processedComponents = flattenBOM(rawRows, rawHeaders, projectName, designatorColumn);

    // --- SEPARATE AMBIGUOUS COMPONENTS ---
    const validComponents = [];
    const ambiguousComponents = [];
    processedComponents.forEach(comp => {
        if (comp._ambiguousQty) {
            ambiguousComponents.push(comp);
        } else {
            validComponents.push(comp);
        }
    });
    // --- END SEPARATION ---

    // Normalize only the valid components for now
    const normalizedValidComponents = validComponents.map(comp => normalizeComponent(comp, config, designatorColumn));

    // Calculate headers based on ALL processed components before normalization/separation
    const headersSet = new Set(['ProjectName']);
    processedComponents.forEach(comp => {
        // Exclude internal flags from headers
        Object.keys(comp).forEach(key => {
            if (key !== 'id' && !key.startsWith('_')) {
                 headersSet.add(key);
            }
        });
    });
    const headers = ['ProjectName', ...Array.from(headersSet).filter(h => h !== 'ProjectName').sort()];

    return {
        validComponents: normalizedValidComponents,
        ambiguousComponents, // Return the ambiguous ones separately
        headers,
        count: rawRows.length // Count original rows
    };
}

