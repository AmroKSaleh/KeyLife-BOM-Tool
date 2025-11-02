/**
 * @file useKiCadParser.js
 * @description Hook for parsing KiCad schematic files.
 * FINAL: Fixed parser logic to correctly buffer all properties
 * before creating the component.
 */

import { useState, useCallback } from 'react';

// ---
// --- Data Structures (Unchanged) ---
// ---
class KiCadComponent {
    constructor(reference) {
        this.reference = reference;
        this.properties = {};
        this.lib_id = '';
        this.instanceText = [];
    }
}

class KiCadSchematic {
    constructor() {
        this.metadata = {};
        this.components = new Map();
        this.symbolDefinitions = new Map();
        this.skippedPowerSymbols = 0;
    }
}


// ---
// --- Helper Function to Get MPN (Unchanged) ---
// ---
const getComponentMPN = (component) => {
    if (!component) return null;
    if (component.properties) {
        return component.properties['Mfr. Part #'] 
            || component.properties['MPN']
            || component.properties['Value']
            || null;
    }
    return component['Mfr. Part #'] || component['MPN'] || null;
};


// ---
// --- Core Parsing Function (MODIFIED) ---
// ---
const parseKiCadSchematicFile = async (file) => {
    const fileContent = await file.text();
    const lines = fileContent.split('\n');
    
    const schematic = new KiCadSchematic();
    
    let inLibSymbolsBlock = false;
    let inSymbolDefinitionBlock = false;
    let currentDefinitionText = [];
    let currentDefinitionId = '';
    
    let inSymbolInstanceBlock = false;
    let currentInstanceText = [];
    let tempComponentProps = {}; // Use a simple temp object
    
    let blockParenDepth = 0;

    // Helper functions
    const getProperty = (line) => {
        const match = line.match(/\(property\s+"([^"]+)"\s+"([^"]*)"/);
        if (match) return { name: match[1], value: match[2] };
        return null;
    };
    const getLibId = (line) => {
        const match = line.match(/\(lib_id\s+"([^"]+)"/);
        if (match) return match[1];
        return null;
    };
    const getSymbolDefId = (line) => {
        const match = line.match(/\(symbol\s+"([^"]+)"/);
        if (match) return match[1];
        return null;
    };

    for (const line of lines) {
        const trimmedLine = line.trim();

        // --- 1. Parse (lib_symbols) Block ---
        if (trimmedLine.startsWith('(lib_symbols')) {
            inLibSymbolsBlock = true;
            blockParenDepth = 1; // Starts at 1
            continue;
        }

        if (inLibSymbolsBlock) {
            const openParenCount = (trimmedLine.match(/\(/g) || []).length;
            const closeParenCount = (trimmedLine.match(/\)/g) || []).length;
            
            // Check for start of a definition
            if (trimmedLine.startsWith('(symbol "') && !inSymbolDefinitionBlock) {
                inSymbolDefinitionBlock = true;
                currentDefinitionId = getSymbolDefId(trimmedLine);
                currentDefinitionText = [line];
            } else if (inSymbolDefinitionBlock) {
                currentDefinitionText.push(line);
            }

            // Must check depth *after* processing line
            blockParenDepth += openParenCount;
            blockParenDepth -= closeParenCount;

            if (inSymbolDefinitionBlock && blockParenDepth === 1 && closeParenCount > 0) { 
                // End of a symbol definition
                inSymbolDefinitionBlock = false;
                if (currentDefinitionId) {
                    schematic.symbolDefinitions.set(currentDefinitionId, currentDefinitionText.join('\n'));
                }
                currentDefinitionId = '';
                currentDefinitionText = [];
            } else if (blockParenDepth === 0) {
                // End of (lib_symbols)
                inLibSymbolsBlock = false;
            }
            continue;
        }

        // --- 2. Extract Title Block (Unchanged) ---
        if (trimmedLine.startsWith('(title_block')) {
            const titleMatch = fileContent.match(/\(title\s+"(.*?)"\)/);
            const dateMatch = fileContent.match(/\(date\s+"(.*?)"\)/);
            const revMatch = fileContent.match(/\(rev\s+"(.*?)"\)/);
            schematic.metadata.Title = titleMatch ? titleMatch[1] : 'N/A';
            schematic.metadata.Date = dateMatch ? dateMatch[1] : 'N/A';
            schematic.metadata.Revision = revMatch ? revMatch[1] : 'N/A';
        }
        
        // --- 3. Parse Component INSTANCE Blocks ---
        if (trimmedLine.startsWith('(symbol') && !inSymbolInstanceBlock && !inLibSymbolsBlock) {
            inSymbolInstanceBlock = true;
            blockParenDepth = 0; // Reset depth for this block
            currentInstanceText = [];
            tempComponentProps = {}; // Reset temp object
        }

        if (inSymbolInstanceBlock) {
            const openParenCount = (trimmedLine.match(/\(/g) || []).length;
            const closeParenCount = (trimmedLine.match(/\)/g) || []).length;
            blockParenDepth += openParenCount;
            blockParenDepth -= closeParenCount;
            
            currentInstanceText.push(line); // Buffer all raw text

            // Extract all properties into the temp object
            if (trimmedLine.startsWith('(lib_id')) {
                tempComponentProps.lib_id = getLibId(trimmedLine);
            }
            if (trimmedLine.startsWith('(property')) {
                const prop = getProperty(trimmedLine);
                if (prop) {
                    tempComponentProps[prop.name] = prop.value;
                }
            }
            
            // Check for end of block
            if (blockParenDepth === 0 && inSymbolInstanceBlock) { 
                const ref = tempComponentProps["Reference"];
                const lib_id = tempComponentProps.lib_id;

                if (ref) { // We found a component with a reference
                    if (ref.startsWith('#')) {
                        schematic.skippedPowerSymbols++;
                    } else if (lib_id) { // And it has a lib_id
                        // Now, create the *final* component object
                        const kicadComponent = new KiCadComponent(ref);
                        kicadComponent.lib_id = lib_id;
                        kicadComponent.properties = tempComponentProps;
                        kicadComponent.instanceText = currentInstanceText;
                        
                        schematic.components.set(ref, kicadComponent);
                    }
                }
                
                // Reset for next symbol
                inSymbolInstanceBlock = false;
                currentInstanceText = [];
                tempComponentProps = {};
            }
        }
    }
    
    return schematic;
};


// ---
// --- The Hook Itself ---
// ---
export const useKiCadParser = () => {
    const [kicadSchematics, setKicadSchematics] = useState({});
    const [isParsingKiCad, setIsParsingKiCad] = useState(false);
    const [kicadError, setKicadError] = useState('');
    const [unmatchedComponents, setUnmatchedComponents] = useState({});

    // ---
    // --- Auto-Linking Function (Unchanged) ---
    // ---
    const autoLinkWithBOM = useCallback((bomComponents, projectName, schematicObject) => { 
        console.log(`[KiCad Link] autoLinkWithBOM (MPN mode) called for project: ${projectName}`);
        
        if (!bomComponents || typeof bomComponents.filter !== 'function') {
            console.error('[KiCad Link] CRITICAL: bomComponents is not a valid array!', bomComponents);
            return { matched: 0, unmatched: 0, unmatchedList: [] };
        }

        if (!schematicObject || !schematicObject.components) {
            console.warn('[KiCad Link] No schematic object was provided to linker.');
            return { matched: 0, unmatched: 0, unmatchedList: [] };
        }

        const schematicComponentMap = schematicObject.components;
        const bomComponentsForProject = bomComponents.filter(c => c.ProjectName === projectName);
        
        const matchedBomComps = [];
        const unmatchedBomComps = [];
        const matchedSchematicRefs = new Set();

        for (const bomComp of bomComponentsForProject) {
            const bomMPN = getComponentMPN(bomComp);
            if (!bomMPN) {
                unmatchedBomComps.push(bomComp);
                continue;
            }

            let foundMatch = false;
            for (const kicadComp of schematicComponentMap.values()) {
                const kicadMPN = getComponentMPN(kicadComp);
                
                if (kicadMPN && kicadMPN === bomMPN) {
                    foundMatch = true;
                    matchedSchematicRefs.add(kicadComp.reference);
                }
            }
            
            if (foundMatch) {
                matchedBomComps.push(bomComp);
            } else {
                unmatchedBomComps.push(bomComp);
            }
        }
        
        const unmatchedSchematicComps = [];
        for (const kicadComp of schematicComponentMap.values()) {
            if (!matchedSchematicRefs.has(kicadComp.reference)) {
                unmatchedSchematicComps.push(kicadComp);
            }
        }

        console.log(`[KiCad Link] -> ${matchedBomComps.length} BOM components MATCHED by MPN.`);
        console.log(`[KiCad Link] -> ${unmatchedBomComps.length} BOM components NOT found in schematic:`, unmatchedBomComps);
        console.log(`[KiCad Link] -> ${unmatchedSchematicComps.length} Schematic components NOT found in BOM:`, unmatchedSchematicComps);
        
        setUnmatchedComponents(prev => ({
            ...prev,
            [projectName]: unmatchedBomComps
        }));
        
        return { 
            matched: matchedBomComps.length, 
            unmatched: unmatchedBomComps.length, 
            unmatchedList: unmatchedBomComps 
        };
    }, []); 

    // ---
    // --- Test Harness Function (Unchanged) ---
    // ---
    const parseKiCadSchematic = useCallback(async (file, projectName, allBomComponents) => {
        setIsParsingKiCad(true);
        setKicadError('');
        console.log(`[KiCad Parse] Parsing "${file.name}" for project "${projectName}"...`);

        try {
            const schematicObject = await parseKiCadSchematicFile(file);
            console.log(`[KiCad Parse] -> Found ${schematicObject.components.size} valid components.`);
            console.log(`[KiCad Parse] -> Skipped ${schematicObject.skippedPowerSymbols} power symbols.`);

            setKicadSchematics(prev => ({
                ...prev,
                [projectName]: {
                    fileName: file.name,
                    uploadDate: Date.now(),
                    schematic: schematicObject, 
                    components: schematicObject.components.size, 
                    metadata: schematicObject.metadata,
                    parsedComponents: Array.from(schematicObject.components.values()), 
                }
            }));
            
            setKicadError(`✓ Parsed ${schematicObject.components.size} components.`);

            autoLinkWithBOM(allBomComponents, projectName, schematicObject);
            
            return Array.from(schematicObject.components.values());

        } catch (err) {
            console.error('[KiCad Parse] Parsing Error:', err);
            setKicadError(`Error parsing KiCad file: ${err.message}`);
            return [];
        } finally {
            setIsParsingKiCad(false);
        }
    }, [autoLinkWithBOM]); 
    
    
    // ---
    // --- copyKiCadSymbolToClipboard (Unchanged) ---
    // ---
    const copyKiCadSymbolToClipboard = useCallback(async (component) => {
        try {
            const projName = component.ProjectName; 
            const compRef = component.Designator || component.reference; 
            
            if (!projName || !compRef) {
                throw new Error("Component is missing ProjectName or Designator.");
            }

            const schematicData = kicadSchematics[projName];
            if (!schematicData || !schematicData.schematic) {
                throw new Error(`No schematic data loaded for project "${projName}".`);
            }

            const kicadComponent = schematicData.schematic.components.get(compRef);
            if (!kicadComponent) {
                throw new Error(`Component "${compRef}" was not found in the schematic data.`);
            }

            const definitionText = schematicData.schematic.symbolDefinitions.get(kicadComponent.lib_id);
            if (!definitionText) {
                throw new Error(`Could not find symbol definition for lib_id: "${kicadComponent.lib_id}"`);
            }
            
            const instanceText = kicadComponent.instanceText.join('\n');
            
            const clipboardText = `(lib_symbols\n  ${definitionText}\n)\n${instanceText}`;

            await navigator.clipboard.writeText(clipboardText);
            
            console.log(`[KiCad Copy] Copied symbol for "${compRef}" to clipboard.`);
            return true; 

        } catch (err) {
            console.error("[KiCad Copy] Error:", err);
            setKicadError(`Failed to copy: ${err.message}`);
            setTimeout(() => setKicadError(''), 5000); 
            return false; 
        }
    }, [kicadSchematics]);

    // ---
    // --- Other Functions (Unchanged) ---
    // ---
    const clearSchematicData = useCallback((projectName) => {
        console.log(`[KiCad] clearSchematicData called for:`, projectName);
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
    
    // ---
    // --- Hook Return Value (Unchanged) ---
    // ---
    return {
        kicadSchematics,
        isParsingKiCad,
        kicadError,
        setKicadError,
        
        // --- Functions ---
        parseKiCadSchematic,
        autoLinkWithBOM,
        copyKiCadSymbolToClipboard, 
        clearSchematicData,
        
        // --- State ---
        unmatchedComponents, 

        // --- Placeholders ---
        syncParams: [],
        setSyncParams: () => {},
        matchWithKiCad: () => { console.log('[KiCad Test] matchWithKiCad (placeholder) called'); },
        generateKiCadComponent: () => { 
            console.log('[KiCad Test] generateKiCadComponent (placeholder) called'); 
            return { copyText: 'Not implemented' }; 
        },
    };
};