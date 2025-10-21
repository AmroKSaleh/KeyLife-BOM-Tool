/**
 * @file useKiCadParser.js
 * @description Hook for parsing KiCad schematic files and linking with BOM components
 */

import { useState, useCallback } from 'react';

export const useKiCadParser = () => {
    const [kicadSchematics, setKicadSchematics] = useState({});
    const [isParsingKiCad, setIsParsingKiCad] = useState(false);
    const [kicadError, setKicadError] = useState('');

    /**
     * Parse KiCad schematic file (.kicad_sch)
     * Extracts component references, values, footprints
     */
    const parseKiCadSchematic = useCallback(async (file, projectName) => {
        setIsParsingKiCad(true);
        setKicadError('');

        try {
            const text = await file.text();
            const components = [];

            // KiCad 6+ uses S-expression format
            // Parse symbol instances
            const symbolRegex = /\(symbol\s*\(lib_id\s*"([^"]+)"\)\s*\(at\s*[\d.-]+\s*[\d.-]+\s*\d+\)\s*(?:\(mirror\s*[xy]\)\s*)?(?:\(unit\s*\d+\)\s*)?\(in_bom\s*yes\)\s*\(on_board\s*yes\)\s*(?:\(dnp\s*no\)\s*)?\(uuid\s*[^)]+\)\s*\(property\s*"Reference"\s*"([^"]+)"/g;
            
            // Extract symbol data
            let match;
            const symbolMap = new Map();
            
            while ((match = symbolRegex.exec(text)) !== null) {
                const libId = match[1];
                const reference = match[2];
                symbolMap.set(reference, { libId, reference });
            }

            // Parse properties for each symbol
            const propertyRegex = /\(property\s*"([^"]+)"\s*"([^"]+)"\s*\(at\s*[\d.-]+\s*[\d.-]+\s*\d+\)/g;
            
            // Group properties by their position in the file
            const lines = text.split('\n');
            let currentSymbol = null;
            const symbolData = {};

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
                            Description: ''
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

            // Convert to array
            Object.values(symbolData).forEach(comp => {
                if (comp.Reference && comp.Value) {
                    components.push({
                        ...comp,
                        ProjectName: projectName,
                        Source: 'KiCad',
                        id: `kicad-${projectName}-${comp.Reference}-${Date.now()}`
                    });
                }
            });

            // Store schematic data
            setKicadSchematics(prev => ({
                ...prev,
                [projectName]: {
                    fileName: file.name,
                    uploadDate: new Date().toISOString(),
                    components: components.length,
                    schematicData: symbolData
                }
            }));

            setKicadError(`✓ Successfully parsed ${components.length} components from ${file.name}`);
            setTimeout(() => setKicadError(''), 5000);

            return components;
        } catch (error) {
            console.error('KiCad parsing error:', error);
            setKicadError(`Failed to parse KiCad file: ${error.message}`);
            return [];
        } finally {
            setIsParsingKiCad(false);
        }
    }, []);

    /**
     * Match BOM component with KiCad schematic component
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

        // Try to match by value
        const value = bomComponent.Value;
        if (value) {
            const match = Object.values(schematicData).find(
                comp => comp.Value === value && !comp._matched
            );
            if (match) {
                match._matched = true;
                return match;
            }
        }

        return null;
    }, [kicadSchematics]);

    /**
     * Generate KiCad-ready component string
     */
    const generateKiCadComponent = useCallback((bomComponent, kicadMatch) => {
        const reference = bomComponent.Designator || bomComponent.Reference || 'REF?';
        const value = bomComponent.Value || kicadMatch?.Value || '';
        const footprint = bomComponent.Footprint || kicadMatch?.Footprint || '';
        const mfrPart = bomComponent['Mfr. Part #'] || '';
        const description = bomComponent.Description || kicadMatch?.Description || '';

        // Generate KiCad symbol format
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
                { name: 'Manufacturer', value: bomComponent.Manufacturer || '' }
            ],
            copyText: `Reference: ${reference}
Value: ${value}
Footprint: ${footprint}
MPN: ${mfrPart}
Manufacturer: ${bomComponent.Manufacturer || 'N/A'}
Description: ${description}`
        };
    }, []);

    /**
     * Save schematic data to localStorage
     */
    const saveKiCadData = useCallback(() => {
        try {
            localStorage.setItem('kicadSchematics', JSON.stringify(kicadSchematics));
        } catch (err) {
            console.error('Failed to save KiCad data:', err);
        }
    }, [kicadSchematics]);

    /**
     * Load schematic data from localStorage
     */
    const loadKiCadData = useCallback(() => {
        try {
            const saved = localStorage.getItem('kicadSchematics');
            if (saved) {
                setKicadSchematics(JSON.parse(saved));
            }
        } catch (err) {
            console.error('Failed to load KiCad data:', err);
        }
    }, []);

    // Auto-save on change
    useState(() => {
        loadKiCadData();
    }, []);

    useState(() => {
        saveKiCadData();
    }, [kicadSchematics]);

    return {
        kicadSchematics,
        isParsingKiCad,
        kicadError,
        setKicadError,
        parseKiCadSchematic,
        matchWithKiCad,
        generateKiCadComponent
    };
};