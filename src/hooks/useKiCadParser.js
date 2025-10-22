/**
 * @file useKiCadParser.js
 * @description Hook for parsing KiCad schematic files and linking with BOM components
 * @updated Added auto-linking, sync params, and unmatched components tracking
 */

import { useState, useCallback, useEffect } from 'react';

export const useKiCadParser = () => {
    const [kicadSchematics, setKicadSchematics] = useState({});
    const [isParsingKiCad, setIsParsingKiCad] = useState(false);
    const [kicadError, setKicadError] = useState('');
    const [syncParams, setSyncParams] = useState(['Datasheet', 'Mfr. Part #']);
    const [unmatchedComponents, setUnmatchedComponents] = useState({});

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedSchematics = localStorage.getItem('kicadSchematics');
            if (savedSchematics) {
                setKicadSchematics(JSON.parse(savedSchematics));
            }

            const savedSyncParams = localStorage.getItem('kicadSyncParams');
            if (savedSyncParams) {
                setSyncParams(JSON.parse(savedSyncParams));
            }
        } catch (err) {
            console.error('Failed to load KiCad data:', err);
        }
    }, []);

    // Save schematics to localStorage
    useEffect(() => {
        try {
            if (Object.keys(kicadSchematics).length > 0) {
                localStorage.setItem('kicadSchematics', JSON.stringify(kicadSchematics));
            }
        } catch (err) {
            console.error('Failed to save KiCad schematics:', err);
        }
    }, [kicadSchematics]);

    // Save sync params to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('kicadSyncParams', JSON.stringify(syncParams));
        } catch (err) {
            console.error('Failed to save sync params:', err);
        }
    }, [syncParams]);

    /**
     * Parse KiCad schematic file (.kicad_sch)
     * Extracts component references, values, footprints
     */
    const parseKiCadSchematic = useCallback(async (file, projectName) => {
        setIsParsingKiCad(true);
        setKicadError('');

        try {
            const text = await file.text();
            const symbolData = {};

            // Parse KiCad 6+ S-expression format
            const lines = text.split('\n');
            let currentSymbol = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Detect symbol start
                if (line.includes('(symbol (lib_id')) {
                    const refMatch = line.match(/Reference"\s*"([^"]+)"/);
                    if (refMatch) {
                        currentSymbol = refMatch[1];
                        symbolData[currentSymbol] = {
                            Reference: currentSymbol,
                            Value: '',
                            Footprint: '',
                            Datasheet: '',
                            Description: '',
                            'Mfr. Part #': ''
                        };
                    }
                }
                
                // Extract properties
                if (currentSymbol && line.includes('(property')) {
                    const propMatch = line.match(/\(property\s*"([^"]+)"\s*"([^"]+)"/);
                    if (propMatch) {
                        const [, propName, propValue] = propMatch;
                        if (symbolData[currentSymbol]) {
                            symbolData[currentSymbol][propName] = propValue;
                        }
                    }
                }
            }

            const componentCount = Object.keys(symbolData).length;

            // Store schematic data
            setKicadSchematics(prev => ({
                ...prev,
                [projectName]: {
                    fileName: file.name,
                    uploadDate: new Date().toISOString(),
                    components: componentCount,
                    schematicData: symbolData,
                    metadata: {
                        'File Format': 'KiCad 6.0+',
                        'Parsed': new Date().toLocaleString()
                    }
                }
            }));

            setKicadError(`✓ Successfully parsed ${componentCount} components from ${file.name}`);
            setTimeout(() => setKicadError(''), 5000);

            return componentCount;
        } catch (error) {
            console.error('KiCad parsing error:', error);
            setKicadError(`Failed to parse KiCad file: ${error.message}`);
            return 0;
        } finally {
            setIsParsingKiCad(false);
        }
    }, []);

    /**
     * Auto-link BOM components with KiCad schematic
     * Returns matched and unmatched components
     */
    const autoLinkWithBOM = useCallback((bomComponents, projectName) => {
        const schematic = kicadSchematics[projectName];
        if (!schematic) {
            return { matched: [], unmatched: [] };
        }

        const schematicData = schematic.schematicData;
        const matched = [];
        const unmatched = [];
        const usedSchematicRefs = new Set();

        bomComponents.forEach(bomComp => {
            if (bomComp.ProjectName !== projectName) return;

            let kicadMatch = null;

            // 1. Primary: Match by Designator/Reference
            const designator = bomComp.Designator || bomComp.Reference;
            if (designator && schematicData[designator] && !usedSchematicRefs.has(designator)) {
                kicadMatch = schematicData[designator];
                usedSchematicRefs.add(designator);
            }

            // 2. Fallback: Try sync parameters in order
            if (!kicadMatch) {
                for (const param of syncParams) {
                    const bomValue = bomComp[param];
                    if (!bomValue) continue;

                    const schematicRef = Object.keys(schematicData).find(ref => {
                        const schematicComp = schematicData[ref];
                        return schematicComp[param] === bomValue && !usedSchematicRefs.has(ref);
                    });

                    if (schematicRef) {
                        kicadMatch = schematicData[schematicRef];
                        usedSchematicRefs.add(schematicRef);
                        break;
                    }
                }
            }

            if (kicadMatch) {
                matched.push({
                    bomComponent: bomComp,
                    kicadComponent: kicadMatch,
                    matchedBy: designator && schematicData[designator] ? 'Designator' : 'Sync Parameter'
                });
            } else {
                unmatched.push(bomComp);
            }
        });

        // Update unmatched components state
        setUnmatchedComponents(prev => ({
            ...prev,
            [projectName]: unmatched
        }));

        return { matched, unmatched };
    }, [kicadSchematics, syncParams]);

    /**
     * Match single BOM component with KiCad
     */
    const matchWithKiCad = useCallback((bomComponent, projectName) => {
        const schematic = kicadSchematics[projectName];
        if (!schematic) return null;

        const schematicData = schematic.schematicData;
        
        // Try to match by designator/reference
        const designator = bomComponent.Designator || bomComponent.Reference;
        if (designator && schematicData[designator]) {
            return schematicData[designator];
        }

        // Try sync parameters
        for (const param of syncParams) {
            const bomValue = bomComponent[param];
            if (!bomValue) continue;

            const match = Object.values(schematicData).find(
                comp => comp[param] === bomValue && !comp._matched
            );
            
            if (match) {
                match._matched = true;
                return match;
            }
        }

        return null;
    }, [kicadSchematics, syncParams]);

    /**
     * Generate KiCad-ready component string
     */
    const generateKiCadComponent = useCallback((bomComponent, kicadMatch) => {
        const reference = bomComponent.Designator || bomComponent.Reference || 'REF?';
        const value = bomComponent.Value || kicadMatch?.Value || '';
        const footprint = bomComponent.Footprint || kicadMatch?.Footprint || '';
        const mfrPart = bomComponent['Mfr. Part #'] || '';
        const description = bomComponent.Description || kicadMatch?.Description || '';
        const datasheet = bomComponent.Datasheet || kicadMatch?.Datasheet || '';

        return {
            reference,
            value,
            footprint,
            fields: [
                { name: 'Reference', value: reference },
                { name: 'Value', value: value },
                { name: 'Footprint', value: footprint },
                { name: 'MPN', value: mfrPart },
                { name: 'Description', value: description },
                { name: 'Manufacturer', value: bomComponent.Manufacturer || '' },
                { name: 'Datasheet', value: datasheet }
            ],
            copyText: `Reference: ${reference}
Value: ${value}
Footprint: ${footprint}
MPN: ${mfrPart}
Manufacturer: ${bomComponent.Manufacturer || 'N/A'}
Description: ${description}
Datasheet: ${datasheet}`
        };
    }, []);

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
        clearSchematicData
    };
};