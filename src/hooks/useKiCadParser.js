/**
 * @file useKiCadParser.js
 * @description Hook for parsing KiCad schematic files and linking with BOM components.
 * It stores the RAW KiCad symbol definition text for direct clipboard export.
 */

import { useState, useCallback, useEffect } from 'react';

// Storage keys
const STORAGE_KEYS = {
    SCHEMATICS: 'kicadSchematics',
    SYNC_PARAMS: 'kicadSyncParams',
    UNMATCHED: 'kicadUnmatched',
};

export const useKiCadParser = () => {
    const [kicadSchematics, setKicadSchematics] = useState({});
    const [isParsingKiCad, setIsParsingKiCad] = useState(false);
    const [kicadError, setKicadError] = useState('');
    const [syncParams, setSyncParams] = useState(['Datasheet', 'Mfr. Part #']);
    const [unmatchedComponents, setUnmatchedComponents] = useState({});

    // --- State Management: Load and Save ---

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedSchematics = localStorage.getItem(STORAGE_KEYS.SCHEMATICS);
            if (savedSchematics) {
                setKicadSchematics(JSON.parse(savedSchematics));
            }

            const savedSyncParams = localStorage.getItem(STORAGE_KEYS.SYNC_PARAMS);
            if (savedSyncParams) {
                setSyncParams(JSON.parse(savedSyncParams));
            }
        } catch (err) {
            console.error('Failed to load KiCad data:', err);
        }
    }, []);

    // Save schematics and sync params to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.SCHEMATICS, JSON.stringify(kicadSchematics));
            localStorage.setItem(STORAGE_KEYS.SYNC_PARAMS, JSON.stringify(syncParams));
        } catch (err) {
            console.error('Failed to save KiCad data:', err);
        }
    }, [kicadSchematics, syncParams]);

    // --- Parsing and Data Preparation ---
    
    /**
     * Parses the .kicad_sch file content, extracting components and their RAW symbol text.
     * @param {File} file - The KiCad schematic file object.
     * @returns {Promise<{components: Array<object>, metadata: object, rawSymbolMap: object}>}
     */
    const parseKiCadSchematicFile = async (file) => {
        const fileContent = await file.text();
        const lines = fileContent.split('\n');
        
        const components = [];
        const metadata = {};
        // KEY: Component Reference (e.g., R1), VALUE: Raw KiCad symbol S-expression text
        const rawSymbolMap = {}; 

        let inSymbolBlock = false;
        let blockParenDepth = 0;
        let currentSymbolRef = null;
        let currentSymbolRawText = [];
        let componentFields = {};

        // Helper to extract value from a field line
        const extractFieldValue = (line) => {
            const valueMatch = line.match(/\(value\s+"(.*?)"\)/);
            return valueMatch ? valueMatch[1] : '';
        };

        // --- Line-by-Line S-Expression Parsing ---
        for (const line of lines) {
            const trimmedLine = line.trim();

            // 1. Extract Title Block Metadata (for schematic info panel)
            if (trimmedLine.startsWith('(title_block')) {
                const titleMatch = fileContent.match(/\(title\s+"(.*?)"\)/);
                const dateMatch = fileContent.match(/\(date\s+"(.*?)"\)/);
                const revMatch = fileContent.match(/\(rev\s+"(.*?)"\)/);
                
                metadata.Title = titleMatch ? titleMatch[1] : 'N/A';
                metadata.Date = dateMatch ? dateMatch[1] : 'N/A';
                metadata.Revision = revMatch ? revMatch[1] : 'N/A';
            }
            
            // 2. Component Symbol Block Identification
            if (trimmedLine.startsWith('(symbol') && !inSymbolBlock) {
                // Found the start of a symbol block
                inSymbolBlock = true;
                blockParenDepth = 0;
                currentSymbolRawText = [];
                componentFields = {};
                
                // Continue to the next step to process this line
            }

            // 3. Process lines inside a symbol block
            if (inSymbolBlock) {
                // Track parenthesis depth to correctly capture the entire S-expression block
                const openParenCount = (trimmedLine.match(/\(/g) || []).length;
                const closeParenCount = (trimmedLine.match(/\)/g) || []).length;
                
                blockParenDepth += openParenCount;
                blockParenDepth -= closeParenCount;

                currentSymbolRawText.push(line);

                // Extract Field Data (name and value) for the BOM table
                if (trimmedLine.startsWith('(field')) {
                    const nameMatch = trimmedLine.match(/\(name\s+"(.*?)"\)/);
                    if (nameMatch) {
                        const fieldName = nameMatch[1];
                        const fieldValue = extractFieldValue(trimmedLine);
                        componentFields[fieldName] = fieldValue;

                        // Identify the main Designator/Reference early
                        if (fieldName === 'Reference' || fieldName === 'RefDes') {
                            currentSymbolRef = fieldValue;
                        }
                    }
                }

                // Check for the end of the block (depth returns to 0 relative to block start)
                if (blockParenDepth === 0) {
                    inSymbolBlock = false;

                    if (currentSymbolRef) {
                        // Save the full raw text block
                        rawSymbolMap[currentSymbolRef] = currentSymbolRawText.join('\n');
                        
                        // Create the simplified BOM component object
                        components.push({
                            id: `${currentSymbolRef}-${Date.now()}`,
                            Designator: currentSymbolRef,
                            ProjectName: file.name, // Will be replaced by actual project name in useKiCadParser
                            // Map all fields found directly to the component object
                            ...componentFields,
                        });
                    }
                    
                    // Reset for the next symbol
                    currentSymbolRef = null;
                    currentSymbolRawText = [];
                    componentFields = {};
                }
            }
        }
        
        return { components, metadata, rawSymbolMap };
    };

    /**
     * Handles the KiCad schematic file upload and parsing.
     */
    const parseKiCadSchematic = useCallback(async (file, projectName) => {
        setIsParsingKiCad(true);
        setKicadError('');

        try {
            const { components, metadata, rawSymbolMap } = await parseKiCadSchematicFile(file);
            
            // Update components with the actual projectName before returning
            const componentsWithProject = components.map(c => ({
                ...c,
                ProjectName: projectName,
            }));

            setKicadSchematics(prev => ({
                ...prev,
                [projectName]: {
                    fileName: file.name,
                    uploadDate: Date.now(),
                    components: components.length,
                    metadata: metadata,
                    rawSymbolMap: rawSymbolMap, // <-- RAW DATA SAVED HERE
                }
            }));
            
            setKicadError(`✓ Successfully parsed ${components.length} components from ${file.name}`);
            setTimeout(() => setKicadError(''), 5000);
            
            return componentsWithProject; // Return components to be merged into the main BOM data
        } catch (err) {
            console.error('KiCad Parsing Error:', err);
            setKicadError(`Error parsing KiCad file: ${err.message}`);
            return [];
        } finally {
            setIsParsingKiCad(false);
        }
    }, []);
    
    
    /**
     * Retrieves the raw KiCad symbol data from the parsed schematic data.
     * @param {object} bomComponent - The component object from the main BOM list.
     * @param {string} projectName - The project the component belongs to.
     * @returns {string} The raw KiCad symbol text, or a simple message if not found.
     */
    const getRawKiCadSymbolText = useCallback((bomComponent, projectName) => {
        const schematicData = kicadSchematics[projectName];
        const designator = bomComponent.Designator || bomComponent.Reference; 

        if (!schematicData || !designator) {
            return `KiCad symbol text not found. Missing schematic data or designator.`;
        }

        // The key must match the component's designator field
        const rawText = schematicData.rawSymbolMap[designator]; 
        
        if (!rawText) {
             return `KiCad symbol text not found for component ${designator}. It may be a global/inherited symbol.`;
        }

        return rawText;
    }, [kicadSchematics]);


    // --- Clipboard Function (The core new feature) ---

    /**
     * Generates the raw KiCad symbol string for a component and copies it to the clipboard.
     * It uses the exact, original text stored during parsing.
     * @param {object} component - The component data object from the BOM. (Must contain ProjectName)
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    const copyKiCadSymbolToClipboard = useCallback(async (component) => {
        const projectName = component.ProjectName;
        
        if (!projectName) {
            setKicadError('Error: Cannot copy KiCad symbol. Component is missing "ProjectName".');
            setTimeout(() => setKicadError(''), 5000);
            return false;
        }

        try {
            // RETRIEVE THE RAW TEXT STORED DURING PARSING
            const kicadString = getRawKiCadSymbolText(component, projectName);
            
            if (kicadString.startsWith('KiCad symbol text not found')) {
                 throw new Error(kicadString);
            }

            // Use the modern Clipboard API
            await navigator.clipboard.writeText(kicadString);
            
            return true;
        } catch (err) {
            console.error('Failed to copy KiCad symbol to clipboard:', err);
            setKicadError(`Error: Failed to copy symbol to clipboard: ${err.message}`);
            setTimeout(() => setKicadError(''), 5000); 
            return false;
        }
    }, [getRawKiCadSymbolText, setKicadError]);

    // --- Other Functions (Simplified) ---

    // This function can now be simplified to just retrieve the raw text for copying if needed elsewhere.
    const generateKiCadComponent = useCallback((bomComponent) => {
        const projectName = bomComponent.ProjectName;
        // NOTE: The actual raw text retrieval is inside the copy function, but we provide 
        // a fallback/simple structure for compatibility if other components rely on this.
        return {
            fields: [], 
            copyText: projectName ? getRawKiCadSymbolText(bomComponent, projectName) : 'Error: Missing ProjectName',
        }
    }, [getRawKiCadSymbolText]);


    /**
     * Clear schematic data for a project
     */
    const clearSchematicData = useCallback((projectName) => {
        setKicadSchematics(prev => {
            const updated = { ...prev };
            delete updated[projectName];
            return updated;
        });

        setUnmatchedComponents(prev => {
            const updated = { ...prev };
            delete updated[projectName];
            return updated;
        });
    }, []);
    
    // --- Linking and Matching logic ---
    
    const autoLinkWithBOM = useCallback((parsedComponents, projectName) => { 
        // Log the call for debugging, but return empty data for now
        console.warn(`autoLinkWithBOM called for project: ${projectName}. Returning unlinked data.`);
        
        // In a real implementation, this would contain the actual linking logic.
        // For now, return the expected structure to prevent the crash.
        return { 
            matched: 0, 
            unmatched: parsedComponents.length, 
            unmatchedList: parsedComponents 
        };
    }, []);
    
    // Ensure matchWithKiCad also returns something if it's called somewhere with destructuring
    const matchWithKiCad = useCallback(() => { 
        setKicadError('Matching logic not yet implemented.'); 
        setTimeout(() => setKicadError(''), 5000);
        
        // Also return an object if this is used with destructuring elsewhere
        return {}; 
    }, [setKicadError]);
    

    // --- Final Return ---

    return {
        kicadSchematics,
        isParsingKiCad,
        kicadError,
        setKicadError,
        syncParams,
        setSyncParams,
        unmatchedComponents,
        parseKiCadSchematic,
        matchWithKiCad,
        generateKiCadComponent,
        autoLinkWithBOM,
        clearSchematicData,
        copyKiCadSymbolToClipboard, 
    };
};