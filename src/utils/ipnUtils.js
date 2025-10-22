/**
 * @file ipnUtils.js
 * @description Core utility functions for Intelligent Part Number (IPN) processing,
 * designator parsing, and data normalization.
 */

// A default map based on common electronics conventions.
// This is used for standalone testing and as a fallback.
export const DEFAULT_DESIGNATOR_MAP = {
    'R': 'Resistor',
    'C': 'Capacitor',
    'L': 'Inductor',
    'D': 'Diode',
    'Q': 'Transistor',
    'U': 'Integrated Circuit',
    'IC': 'Integrated Circuit',
    'J': 'Connector',
    'P': 'Connector',
    'SW': 'Switch',
    'F': 'Fuse',
    'T': 'Transformer',
    'K': 'Relay',
    'X': 'Crystal/Oscillator',
    'Y': 'Crystal',
    'BT': 'Battery',
    'TP': 'Test Point',
    'FID': 'Fiducial',
    'FB': 'Ferrite Bead',
    'RN': 'Resistor Network'
};

/**
 * Determines the component type (e.g., 'Resistor', 'Capacitor') based on its
 * designator (e.g., 'R101', 'C45').
 * * @param {string} designator - The component designator (e.g., 'R101').
 * @param {object} customDesignatorMap - The user's configurable map of prefixes to types.
 * @returns {string} The component type or 'Unspecified' if no match is found.
 */
export function getComponentType(designator, customDesignatorMap = {}) {
    if (!designator || typeof designator !== 'string') {
        return 'Unspecified';
    }

    // 1. Combine default and custom maps (custom overrides default)
    const combinedMap = { ...DEFAULT_DESIGNATOR_MAP, ...customDesignatorMap };
    
    // Normalize designator: remove spaces and make uppercase
    const normalizedDesignator = designator.trim().toUpperCase();

    // 2. Find the component prefix (one or more leading letters)
    // The regex /^[A-Z]+/ matches one or more uppercase letters at the start of the string.
    const prefixMatch = normalizedDesignator.match(/^[A-Z]+/);

    if (prefixMatch && prefixMatch[0]) {
        const prefix = prefixMatch[0];
        
        // 3. Look up the prefix in the combined map
        if (combinedMap[prefix]) {
            return combinedMap[prefix];
        }
    }

    // 4. Return 'Unspecified' if no prefix or no match was found
    return 'Unspecified';
}

// Export the DEFAULT_DESIGNATOR_MAP for use in other components if needed
export default { 
    getComponentType,
    DEFAULT_DESIGNATOR_MAP
};
