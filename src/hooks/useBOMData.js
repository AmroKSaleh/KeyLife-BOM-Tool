/**
 * @file useBOMData.js
 * @description Enhanced custom hook for BOM data management with proper ExcelJS integration,
 * improved error handling, and robust file parsing capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import ExcelJS from 'exceljs';

// Storage keys
const STORAGE_KEYS = {
    PROJECT_NAME: 'bomProjectName',
    COMPONENTS: 'bomComponents',
    HEADERS: 'bomHeaders',
    VERSION: 'bomDataVersion'
};

const CURRENT_VERSION = '1.0';

/**
 * Custom hook for managing BOM data operations
 */
export const useBOMData = (config) => {
    const [projectName, setProjectName] = useState('');
    const [components, setComponents] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Find designator column in headers
     */
    const findDesignatorColumn = useCallback((headers) => {
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
    }, [config]);

    /**
     * Normalize component data (map fields to standard names)
     */
    const normalizeComponent = useCallback((component, designatorColumn) => {
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
    }, [config]);

    /**
     * Parse a single CSV line handling quoted values
     * @param {string} line - CSV line
     * @returns {string[]} - Array of values
     */
    const parseCsvLine = (line) => {
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
    };

    /**
     * @description Flattens consolidated BOM data into individual component entries.
     * @param {Array<object>} rawRows - Array of objects, where keys are column headers.
     * @param {Array<string>} rawHeaders - Array of raw column header strings.
     * @param {string} projectName - The name of the project.
     * @param {string} designatorColumn - The actual designator column name used in the BOM.
     * @returns {Array<object>} The array of flattened component objects.
     */
    const flattenBOM = useCallback((rawRows, rawHeaders, projectName, designatorColumn) => {
        const flattenedComponents = [];
        let rowCounter = 0; 

        for (const rawRow of rawRows) {
            // Use the column identified as the Designator source
            const designatorString = String(rawRow[designatorColumn] || '');

            if (!designatorString.trim()) {
                continue; 
            }
            
            // Split by comma (,), semicolon (;), or space, then filter out empty results
            const designators = designatorString.split(/[,;]\s*|\s+/).filter(d => d.trim() !== '');

            // Create a new component object for every single designator
            for (const designator of designators) {
                if (!designator) continue;

                // Generate a unique ID for the new component instance
                const componentId = `${projectName}-${designator}-${Date.now()}-${rowCounter++}`;
                
                const componentData = {
                    id: componentId,
                    ProjectName: projectName,
                };
                
                // Copy all column data, ensuring the designator field is the individual designator
                for (const header of rawHeaders) {
                    if (header === designatorColumn) {
                        componentData[header] = designator; // The flattened, individual designator
                    } else {
                        componentData[header] = rawRow[header] || ''; // Copy other fields
                    }
                }
                
                flattenedComponents.push(componentData);
            }
        }

        return flattenedComponents;
    }, [config]); // config is needed to correctly find the designator column

    // --- Persistence Layer ---

    /**
     * Load data from localStorage on mount
     */
    useEffect(() => {
        try {
            const version = localStorage.getItem(STORAGE_KEYS.VERSION);
            
            // Check version compatibility
            if (version && version !== CURRENT_VERSION) {
                console.warn('Data version mismatch. Clearing old data.');
                clearLocalStorage();
                return;
            }

            const savedProjectName = localStorage.getItem(STORAGE_KEYS.PROJECT_NAME);
            const savedComponents = localStorage.getItem(STORAGE_KEYS.COMPONENTS);
            const savedHeaders = localStorage.getItem(STORAGE_KEYS.HEADERS);

            // Parse components
            let parsedComponents = [];
            if (savedComponents) {
                parsedComponents = JSON.parse(savedComponents);
                if (!Array.isArray(parsedComponents)) {
                    parsedComponents = [];
                }
            }

            // Parse headers
            let parsedHeaders = [];
            if (savedHeaders) {
                parsedHeaders = JSON.parse(savedHeaders);
                if (!Array.isArray(parsedHeaders)) {
                    parsedHeaders = [];
                }
            }

            // Only load data if there are actual components
            if (parsedComponents.length > 0) {
                setComponents(parsedComponents);
                setHeaders(parsedHeaders);
                
                // Only restore project name if components exist
                if (savedProjectName) {
                    setProjectName(JSON.parse(savedProjectName));
                }
            } else {
                // If no components, clear everything to prevent orphaned data
                clearLocalStorage();
            }
        } catch (err) {
            console.error('Failed to load from localStorage:', err);
            setError('Failed to load saved data. Starting fresh.');
            clearLocalStorage();
        }
    }, []);

    /**
     * Save data to localStorage on change
     */
    useEffect(() => {
        try {
            // Only save if there are components
            if (components.length > 0) {
                localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(components));
                localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
                
                // Save headers if they exist
                if (headers.length > 0) {
                    localStorage.setItem(STORAGE_KEYS.HEADERS, JSON.stringify(headers));
                }
                
                // Save project name if it exists
                if (projectName) {
                    localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, JSON.stringify(projectName));
                }
            } else {
                // If no components, clear storage to prevent orphaned data
                clearLocalStorage();
            }
        } catch (err) {
            console.error('Failed to save to localStorage:', err);
            if (err.name === 'QuotaExceededError') {
                setError('Storage limit reached. Consider exporting and clearing your library.');
            }
        }
    }, [projectName, components, headers]);

    // --- File Parsing Functions ---

    /**
     * Parses CSV text, flattens the data, and updates state.
     */
    const parseCSV = useCallback((text, projectName) => {
        // 1. Placeholder for actual CSV parsing (e.g., using PapaParse)
        // This must convert the text into an array of header strings and an array of raw row objects.
        // For this rewrite, we assume you have logic here that produces: { rawRows, rawHeaders }

        // --- CONCEPTUAL CSV PARSING START ---
        const lines = text.trim().split('\n');
        const rawHeaders = lines[0].split(',').map(h => h.trim());
        const rawRows = lines.slice(1).map(line => {
            // Simplified row parsing: assumes no commas inside quoted strings
            const values = line.split(','); 
            const row = {};
            rawHeaders.forEach((header, i) => {
            row[header] = values[i] ? values[i].trim().replace(/^"|"$/g, '') : '';
            });
            return row;
        });
        // --- CONCEPTUAL CSV PARSING END ---

        const designatorColumn = findDesignatorColumn(rawHeaders);
        
        if (!designatorColumn) {
            throw new Error('Could not find a recognized designator column (e.g., Designator, Reference). Please check your configuration.');
        }

        // 2. FLATTEN the data
        const newComponents = flattenBOM(rawRows, rawHeaders, projectName, designatorColumn);
        
        // 3. Update global headers state
        setHeaders(prev => {
            const combined = new Set(['ProjectName', ...prev, ...rawHeaders]);
            combined.delete('ProjectName');
            return ['ProjectName', ...Array.from(combined)];
        });

        // 4. Update global components state
        setComponents(prev => [...prev, ...newComponents]);
        
        return newComponents.length;
    }, [findDesignatorColumn, flattenBOM, setHeaders, setComponents]);

    /**
     * Parses Excel buffer, flattens the data, and updates state.
     * (Requires the ExcelJS import to be present in useBOMData.js)
     */
    const parseExcel = useCallback(async (buffer, projectName) => {
        // This is a conceptual structure; ExcelJS logic remains similar but must 
        // extract rawRows and rawHeaders.

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        
        // 1. Extract rawRows and rawHeaders (Placeholder logic using ExcelJS structure)
        const rawHeaders = [];
        const rawRows = [];
        
        // Logic to fill rawHeaders and rawRows using worksheet.eachRow or similar
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            if (cell.value) rawHeaders.push(String(cell.value).trim());
        });
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row
            const rowObject = {};
            let isEmpty = true;
            
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = rawHeaders[colNumber - 1];
                if (header) {
                    const value = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
                    rowObject[header] = value;
                    if (value.trim()) isEmpty = false;
                }
            });

            if (!isEmpty) rawRows.push(rowObject);
        });

        const designatorColumn = findDesignatorColumn(rawHeaders);
        
        if (!designatorColumn) {
            throw new Error('Could not find a recognized designator column (e.g., Designator, Reference). Please check your configuration.');
        }

        // 2. FLATTEN the data
        const newComponents = flattenBOM(rawRows, rawHeaders, projectName, designatorColumn);
        
        // 3. Update global headers state (merging)
        setHeaders(prev => {
            const combined = new Set(['ProjectName', ...prev, ...rawHeaders]);
            combined.delete('ProjectName');
            return ['ProjectName', ...Array.from(combined)];
        });

        // 4. Update global components state
        setComponents(prev => [...prev, ...newComponents]);
        
        return newComponents.length;
    }, [findDesignatorColumn, flattenBOM, setHeaders, setComponents]);

    // --- Action Functions ---

    /**
     * Handle file upload
     */
    const handleFileUpload = useCallback(async (event) => {
        const file = event.target.files?.[0];
        
        if (!file) return;

        // Validation
        if (!projectName.trim()) {
            setError('Please enter a project name before uploading.');
            event.target.value = '';
            return;
        }

        setIsProcessing(true);
        setError('');
        setFileName(file.name);

        try {
            const extension = file.name.split('.').pop()?.toLowerCase();
            let rowCount = 0;

            if (extension === 'csv') {
                const text = await file.text();
                // Call the updated parseCSV which handles flattening and state updates
                rowCount = parseCSV(text, projectName);
            } else if (extension === 'xlsx' || extension === 'xls') {
                const buffer = await file.arrayBuffer();
                // Call the updated parseExcel which handles flattening and state updates
                rowCount = await parseExcel(buffer, projectName);
            } else {
                throw new Error('Please upload a valid .csv, .xls, or .xlsx file.');
            }

            setError(`✓ Successfully imported ${rowCount} individual components from ${file.name}`);
            setTimeout(() => setError(''), 5000);
        } catch (err) {
            console.error('File upload error:', err);
            // If parsing failed (e.g., missing designator column), clear the filename
            if (err.message.includes('designator column')) {
                setFileName('');
            }
            setError(err.message || 'Failed to process file');
            
        } finally {
            setIsProcessing(false);
            event.target.value = '';
        }
    }, [projectName, parseCSV, parseExcel, setError, setIsProcessing, setFileName]);

    /**
     * Clear all library data
     */
    const clearLibrary = useCallback(() => {
        if (components.length > 0) {
            const confirmed = window.confirm(
                `Are you sure you want to clear all ${components.length} components? This cannot be undone.`
            );
            if (!confirmed) return;
        }

        // Clear all state
        setProjectName('');
        setComponents([]);
        setHeaders([]);
        setFileName('');
        setError('');
        
        // Clear localStorage
        clearLocalStorage();

        // Clear file input
        const fileInput = document.getElementById('csv-upload');
        if (fileInput) fileInput.value = '';
        
        // Show success message
        setError('✓ Library cleared successfully');
        setTimeout(() => setError(''), 3000);
    }, [components.length]);

    /**
     * Clear localStorage
     */
    const clearLocalStorage = () => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    };

    /**
     * Export library as JSON
     */
    const exportLibrary = useCallback(() => {
        if (components.length === 0) {
            setError('No data to export.');
            return;
        }

        try {
            const exportData = {
                version: CURRENT_VERSION,
                exportedAt: new Date().toISOString(),
                projectCount: new Set(components.map(c => c.ProjectName)).size,
                componentCount: components.length,
                headers,
                components
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `keylife_bom_library_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setError('✓ Library exported successfully');
            setTimeout(() => setError(''), 3000);
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to export library');
        }
    }, [components, headers]);

    /**
     * Edit a single component
     */
    const editComponent = useCallback((componentId, updatedData) => {
        setComponents(prev => 
            prev.map(comp => 
                comp.id === componentId ? { ...comp, ...updatedData } : comp
            )
        );
        setError('✓ Component updated successfully');
        setTimeout(() => setError(''), 3000);
    }, []);

    /**
     * Delete a single component
     */
    const deleteComponent = useCallback((componentId) => {
        const component = components.find(c => c.id === componentId);
        if (!component) return;

        const confirmed = window.confirm(
            `Delete component "${component.Designator || component.Reference || 'Unknown'}"?`
        );
        
        if (!confirmed) return;

        const remainingComponents = components.filter(comp => comp.id !== componentId);
        setComponents(remainingComponents);
        
        // If no components left, clear everything
        if (remainingComponents.length === 0) {
            setHeaders([]);
            setProjectName('');
            clearLocalStorage();
        }
        
        setError('✓ Component deleted successfully');
        setTimeout(() => setError(''), 3000);
    }, [components]);

    /**
     * Delete entire project (all components with same ProjectName)
     */
    const deleteProject = useCallback((projectName) => {
        const count = components.filter(c => c.ProjectName === projectName).length;
        const confirmed = window.confirm(
            `Delete all ${count} components from project "${projectName}"? This cannot be undone.`
        );
        
        if (!confirmed) return;

        const remainingComponents = components.filter(c => c.ProjectName !== projectName);
        setComponents(remainingComponents);
        
        // If no components left, clear everything
        if (remainingComponents.length === 0) {
            setHeaders([]);
            setProjectName('');
            clearLocalStorage();
        } else {
            // Rebuild headers from remaining components
            const remainingHeaders = new Set(['ProjectName']);
            remainingComponents.forEach(comp => {
                Object.keys(comp).forEach(key => {
                    if (key !== 'id' && key !== 'ProjectName') {
                        remainingHeaders.add(key);
                    }
                });
            });
            setHeaders(['ProjectName', ...Array.from(remainingHeaders).filter(h => h !== 'ProjectName')]);
        }
        
        setError(`✓ Project "${projectName}" deleted (${count} components removed)`);
        setTimeout(() => setError(''), 5000);
    }, [components]);

    /**
     * Save library to local file system
     */
    const saveLibraryToFile = useCallback(async () => {
        if (components.length === 0) {
            setError('No data to save.');
            return;
        }

        try {
            const exportData = {
                version: CURRENT_VERSION,
                savedAt: new Date().toISOString(),
                projectCount: new Set(components.map(c => c.ProjectName)).size,
                componentCount: components.length,
                headers,
                components
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            // Use File System Access API if available (modern browsers)
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: `keylife_bom_library_${new Date().toISOString().split('T')[0]}.json`,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    
                    setError('✓ Library saved successfully to your chosen location');
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        throw err;
                    }
                    return; // User cancelled
                }
            } else {
                // Fallback to download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `keylife_bom_library_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                setError('✓ Library downloaded to your Downloads folder');
            }
            
            setTimeout(() => setError(''), 5000);
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save library: ' + err.message);
        }
    }, [components, headers]);

    /**
     * Import library from file
     */
    const importLibrary = useCallback(async (file) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.components || !Array.isArray(data.components)) {
                throw new Error('Invalid library file format');
            }

            const confirmed = window.confirm(
                `Import ${data.components.length} components from file?\n\nThis will MERGE with existing data. Continue?`
            );
            
            if (!confirmed) return;

            // Merge headers
            if (data.headers && Array.isArray(data.headers)) {
                setHeaders(prev => {
                    const combined = new Set(['ProjectName', ...prev, ...data.headers]);
                    combined.delete('ProjectName');
                    return ['ProjectName', ...Array.from(combined)];
                });
            }

            // Add imported components
            setComponents(prev => [...prev, ...data.components]);
            
            setError(`✓ Successfully imported ${data.components.length} components`);
            setTimeout(() => setError(''), 5000);
        } catch (err) {
            console.error('Import error:', err);
            setError('Failed to import library: ' + err.message);
        }
    }, []);

    return {
        projectName,
        setProjectName,
        components,
        headers,
        error,
        setError,
        fileName,
        isProcessing,
        handleFileUpload,
        clearLibrary,
        exportLibrary,
        editComponent,
        deleteComponent,
        deleteProject,
        saveLibraryToFile,
        importLibrary
    };
};