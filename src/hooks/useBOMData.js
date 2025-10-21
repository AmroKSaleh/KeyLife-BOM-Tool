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
export const useBOMData = () => {
    const [projectName, setProjectName] = useState('');
    const [components, setComponents] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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

            if (savedProjectName) {
                setProjectName(JSON.parse(savedProjectName));
            }
            if (savedComponents) {
                const parsed = JSON.parse(savedComponents);
                setComponents(Array.isArray(parsed) ? parsed : []);
            }
            if (savedHeaders) {
                const parsed = JSON.parse(savedHeaders);
                setHeaders(Array.isArray(parsed) ? parsed : []);
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
            if (projectName) {
                localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, JSON.stringify(projectName));
            }
            if (components.length > 0) {
                localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(components));
            }
            if (headers.length > 0) {
                localStorage.setItem(STORAGE_KEYS.HEADERS, JSON.stringify(headers));
            }
            localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
        } catch (err) {
            console.error('Failed to save to localStorage:', err);
            if (err.name === 'QuotaExceededError') {
                setError('Storage limit reached. Consider exporting and clearing your library.');
            }
        }
    }, [projectName, components, headers]);

    // --- File Parsing Functions ---

    /**
     * Parse Excel files using ExcelJS
     * @param {ArrayBuffer} buffer - File buffer
     * @param {string} currentProjectName - Project name to assign
     */
    const parseExcel = useCallback(async (buffer, currentProjectName) => {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error('No worksheets found in the Excel file.');
            }

            const data = [];
            const excelHeaders = [];
            let isFirstRow = true;

            worksheet.eachRow((row, rowNumber) => {
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    const cellValue = cell.value?.toString() || '';
                    
                    if (isFirstRow) {
                        excelHeaders.push(cellValue.trim());
                    } else {
                        const header = excelHeaders[colNumber - 1];
                        if (header) {
                            rowData[header] = cellValue.trim();
                        }
                    }
                });

                if (isFirstRow) {
                    isFirstRow = false;
                } else if (Object.keys(rowData).length > 0) {
                    rowData.ProjectName = currentProjectName;
                    rowData.id = `${currentProjectName}-${rowNumber}-${Date.now()}`;
                    data.push(rowData);
                }
            });

            if (data.length === 0) {
                throw new Error('No data rows found in the Excel file.');
            }

            // Merge headers (ensure ProjectName is first)
            setHeaders(prev => {
                const combined = new Set(['ProjectName', ...prev, ...excelHeaders]);
                combined.delete('ProjectName'); // Remove to re-add at start
                return ['ProjectName', ...Array.from(combined)];
            });

            setComponents(prev => [...prev, ...data]);
            setError('');
            
            return data.length;
        } catch (err) {
            console.error('Excel parsing error:', err);
            throw new Error(`Excel parsing failed: ${err.message}`);
        }
    }, []);

    /**
     * Parse CSV files with improved handling
     * @param {string} csvText - CSV file content
     * @param {string} currentProjectName - Project name to assign
     */
    const parseCSV = useCallback((csvText, currentProjectName) => {
        try {
            const lines = csvText.trim().split(/\r?\n/);
            
            if (lines.length < 2) {
                throw new Error('CSV must have at least a header row and one data row.');
            }

            // Parse CSV header
            const headerLine = lines[0];
            const csvHeaders = parseCsvLine(headerLine).map(h => h.trim());

            if (csvHeaders.length === 0) {
                throw new Error('No headers found in CSV file.');
            }

            // Parse data rows
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Skip empty lines

                const values = parseCsvLine(line);
                const rowData = { ProjectName: currentProjectName };

                csvHeaders.forEach((header, index) => {
                    rowData[header] = values[index]?.trim() || '';
                });

                rowData.id = `${currentProjectName}-${i}-${Date.now()}`;
                data.push(rowData);
            }

            if (data.length === 0) {
                throw new Error('No data rows found in CSV file.');
            }

            // Merge headers
            setHeaders(prev => {
                const combined = new Set(['ProjectName', ...prev, ...csvHeaders]);
                combined.delete('ProjectName');
                return ['ProjectName', ...Array.from(combined)];
            });

            setComponents(prev => [...prev, ...data]);
            setError('');
            
            return data.length;
        } catch (err) {
            console.error('CSV parsing error:', err);
            throw new Error(`CSV parsing failed: ${err.message}`);
        }
    }, []);

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
                rowCount = parseCSV(text, projectName);
            } else if (extension === 'xlsx' || extension === 'xls') {
                const buffer = await file.arrayBuffer();
                rowCount = await parseExcel(buffer, projectName);
            } else {
                throw new Error('Please upload a valid .csv, .xls, or .xlsx file.');
            }

            setError(`✓ Successfully imported ${rowCount} components from ${file.name}`);
            setTimeout(() => setError(''), 5000);
        } catch (err) {
            console.error('File upload error:', err);
            setError(err.message || 'Failed to process file');
            setFileName('');
        } finally {
            setIsProcessing(false);
            event.target.value = '';
        }
    }, [projectName, parseCSV, parseExcel]);

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

        setProjectName('');
        setComponents([]);
        setHeaders([]);
        setFileName('');
        setError('');
        clearLocalStorage();

        const fileInput = document.getElementById('csv-upload');
        if (fileInput) fileInput.value = '';
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
        exportLibrary
    };
};