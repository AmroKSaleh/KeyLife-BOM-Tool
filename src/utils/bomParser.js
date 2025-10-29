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

    // Map designator first if needed
    if (designatorColumn && designatorColumn !== 'Designator' && component[designatorColumn]) {
        normalized.Designator = component[designatorColumn];
    }

    // Apply standard field mappings
    Object.entries(config.fieldMappings || {}).forEach(([from, to]) => {
        // Only map if the 'from' field exists and the 'to' field doesn't already exist OR if mapping Qty->Quantity
        if (component[from] !== undefined && (component[to] === undefined || (from.toLowerCase() === 'qty' && to === 'Quantity'))) {
            normalized[to] = component[from];
        }
    });

    // Explicitly remove 'Qty' if 'Quantity' now exists due to mapping
    if (normalized.Quantity !== undefined && normalized.Qty !== undefined) {
        delete normalized.Qty;
    }

    return normalized;
}

/**
 * @function flattenBOM
 * @description Processes raw rows, either flattening designators or flagging ambiguous rows.
 * @returns {{flattened: Array<object>, ambiguous: Array<object>}}
 */
export function flattenBOM(rawRows, rawHeaders, projectName, designatorColumn, config) {
    if (!rawRows || !rawHeaders || !projectName || !designatorColumn || !config) return { flattened: [], ambiguous: [] };
    const flattenedComponents = [];
    const ambiguousComponents = [];
    let rowCounter = 0;
    
    // 1. Get all alternate names for "Quantity" from config
    const quantityAltNames = Object.entries(config.fieldMappings || {})
        .filter(([_, to]) => to === 'Quantity')
        .map(([from, _]) => from.toLowerCase());

    // 2. Create a unique, prioritized list of names to check (all lowercase)
    const qtyColumnNames = [
        'quantity', // Standard name first
        ...quantityAltNames,
        // Add hardcoded fallbacks
        'qty',
        'qnt',
        'count',
        'amount'
    ];
    const uniqueQtyNames = [...new Set(qtyColumnNames)];

    // 3. Find the first matching header in rawHeaders (case-insensitive)
    let qtyColumn = null;
    for (const name of uniqueQtyNames) {
        const matchingHeader = rawHeaders.find(h => h.toLowerCase() === name);
        if (matchingHeader) {
            qtyColumn = matchingHeader; // Use the original cased header name
            break;
        }
    }
    // --- END NEW Logic ---

    const hasQuantityColumn = !!qtyColumn;

    for (const rawRow of rawRows) {
        if (!rawRow) continue;
        const designatorString = String(rawRow[designatorColumn] || '');
        if (!designatorString.trim()) continue;

        // Split by comma (,), semicolon (;), or space
        const separatorsRegex = /[,;]\s*|\s+/;
        const potentialDesignators = designatorString.split(separatorsRegex).filter(d => d && d.trim() !== '');
        const hasMultipleDesignators = potentialDesignators.length > 1;

        let quantity = 1;
        if (hasQuantityColumn) {
            const rawQty = rawRow[qtyColumn] ? String(rawRow[qtyColumn]).trim() : '1';
            quantity = parseInt(rawQty, 10);
            if (isNaN(quantity) || quantity < 1) quantity = 1;
        }

        // --- AMBIGUITY DETECTION: Multiple Designators AND listed Quantity > 1 ---
        const isAmbiguous = hasMultipleDesignators && hasQuantityColumn && quantity > 1;

        if (isAmbiguous) {
            // Flag the row for resolution in the UI
            const componentId = `${projectName}-${designatorString.trim()}-${Date.now()}-${rowCounter++}`;
            const ambiguousComp = { 
                id: componentId, 
                ProjectName: projectName, 
                ...rawRow
            };

            // Add internal flags for the modal to use
            ambiguousComp._ambiguousQty = true;
            ambiguousComp._potentialDesignators = potentialDesignators;
            ambiguousComp._originalQty = quantity;
            ambiguousComp._qtyColumnName = qtyColumn;
            
            ambiguousComponents.push(ambiguousComp);
        } else if (hasMultipleDesignators && !hasQuantityColumn) {
            // Case 2: Multiple designators but NO explicit QTY column. Assume Quantity=1 for each and flatten immediately.
            const designators = potentialDesignators;
            for (const designator of designators) {
                const componentId = `${projectName}-${designator}-${Date.now()}-${rowCounter++}`;
                const componentData = { id: componentId, ProjectName: projectName };
                for (const header of rawHeaders) {
                    componentData[header] = (header === designatorColumn) ? designator : (rawRow[header] || '');
                }
                flattenedComponents.push(componentData);
            }
        } else {
            // Case 3: Single designator OR Multiple designators with Quantity=1. No ambiguity.
            const componentId = `${projectName}-${designatorString.trim()}-${Date.now()}-${rowCounter++}`;
            const componentData = { id: componentId, ProjectName: projectName };
            for (const header of rawHeaders) {
                componentData[header] = rawRow[header] || '';
            }
            flattenedComponents.push(componentData);
        }
    }
    return { flattened: flattenedComponents, ambiguous: ambiguousComponents };
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
 * @function processBOMFile
 * @description Parses the file and separates components into normalized and ambiguous lists.
 * @returns {Promise<{components: Array<object>, ambiguousComponents: Array<object>, headers: Array<string>, count: number}>}
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

    // Call updated flattenBOM
    const { flattened, ambiguous } = flattenBOM(rawRows, rawHeaders, projectName, designatorColumn, config);

    // Normalize ONLY the non-ambiguous, already flattened components
    const normalizedComponents = flattened.map(comp => normalizeComponent(comp, config, designatorColumn));

    // Consolidate headers from both normalized and ambiguous components
    const allComponentsForHeaderScan = [...normalizedComponents, ...ambiguous];
    const headersSet = new Set(['ProjectName']);
    allComponentsForHeaderScan.forEach(comp => {
        Object.keys(comp).forEach(key => { 
            // Exclude internal flags (starting with _) and standard metadata
            if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && !key.startsWith('_')) headersSet.add(key); 
        });
    });
    
    const headers = ['ProjectName', ...Array.from(headersSet).filter(h => h !== 'ProjectName').sort()];

    // Return normalized components (non-ambiguous) and raw ambiguous components
    return { 
        components: normalizedComponents, 
        ambiguousComponents: ambiguous, 
        headers, 
        count: normalizedComponents.length + ambiguous.length 
    };
}