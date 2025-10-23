/**
 * @file lpnUtils.js
 * @description Utility functions for Local Part Number (LPN) generation
 * Format: KL-{Sequence}-{Hash}
 * Example: KL-00123-A3F142
 * 
 * The hash is based ONLY on the Manufacturer Part Number (MPN) which is the 
 * immutable identifier. Once an LPN is assigned, the MPN field becomes locked
 * and cannot be edited to maintain data integrity.
 */

/**
 * Formats a number as a 5-digit sequence string
 * @param {number} sequenceNumber - Sequential number (1 to 99999)
 * @returns {string} - Zero-padded 5-digit string
 * 
 * @example
 * formatSequence(1)     // Returns "00001"
 * formatSequence(123)   // Returns "00123"
 * formatSequence(99999) // Returns "99999"
 */
export function formatSequence(sequenceNumber) {
    // Ensure it's a valid number
    const num = parseInt(sequenceNumber, 10);
    
    if (isNaN(num) || num < 1 || num > 99999) {
        throw new Error('Sequence number must be between 1 and 99999');
    }

    // Pad with zeros to 5 digits
    return num.toString().padStart(5, '0');
}

/**
 * Generates a 6-character hash from the Manufacturer Part Number
 * Uses a simple character-based hashing algorithm
 * @param {string} mpn - Manufacturer Part Number (the immutable identifier)
 * @returns {string} - 6-character uppercase hex hash
 * 
 * @example
 * generateMPNHash("RC0603FR-07100KL") // Returns "A3F142" (example)
 * generateMPNHash("STM32F407VGT6")    // Returns "B7E293" (example)
 */
export function generateMPNHash(mpn) {
    if (!mpn || typeof mpn !== 'string') {
        return '000000';
    }

    // Normalize the MPN: uppercase and trim
    const normalizedMPN = mpn.trim().toUpperCase();

    // Simple hash algorithm (similar to Java's hashCode)
    let hash = 0;
    for (let i = 0; i < normalizedMPN.length; i++) {
        const char = normalizedMPN.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive number and format as 6-digit hex
    const positiveHash = Math.abs(hash);
    const hexHash = positiveHash.toString(16).toUpperCase();
    
    // Take last 6 characters or pad with zeros
    return hexHash.padStart(6, '0').slice(-6);
}

/**
 * Extracts the Manufacturer Part Number from a component object
 * Tries multiple common field names for MPN
 * @param {object} component - Component object
 * @returns {string|null} - The MPN or null if not found
 * 
 * @example
 * const component = { "Mfr. Part #": "RC0603FR-07100KL" };
 * extractMPN(component) // Returns "RC0603FR-07100KL"
 */
export function extractMPN(component) {
    // Handle null/undefined component
    if (!component || typeof component !== 'object') {
        return null;
    }

    // Common field names for Manufacturer Part Number
    const mpnFields = [
        'Mfr. Part #',
        'MPN',
        'Manufacturer Part Number',
        'Part Number',
        'PartNumber',
        'Part#'
    ];

    for (const field of mpnFields) {
        if (component[field] && component[field].trim()) {
            return component[field].trim();
        }
    }

    return null;
}

/**
 * Assembles the complete LPN string
 * @param {number} sequence - Sequential number (1-99999)
 * @param {string} hash - 6-character hash based on MPN
 * @returns {string} - Complete LPN in format KL-{Sequence}-{Hash}
 * 
 * @example
 * assembleLPN(123, "A3F142") // Returns "KL-00123-A3F142"
 * assembleLPN(1, "B7E293")   // Returns "KL-00001-B7E293"
 */
export function assembleLPN(sequence, hash) {
    const formattedSequence = formatSequence(sequence);
    return `KL-${formattedSequence}-${hash}`;
}

/**
 * Validates if a component has the required MPN field for LPN generation
 * @param {object} component - Component object to validate
 * @returns {boolean} - True if component has a valid MPN, false otherwise
 * 
 * @example
 * validateComponentForLPN({ "Mfr. Part #": "RC0603FR-07100KL" }) // Returns true
 * validateComponentForLPN({ "Value": "100k" }) // Returns false
 */
export function validateComponentForLPN(component) {
    const mpn = extractMPN(component);
    return mpn !== null && mpn.length > 0;
}

/**
 * Checks if a component has an LPN assigned
 * @param {object} component - Component object to check
 * @returns {boolean} - True if component has an LPN assigned
 * 
 * @example
 * hasLPN({ "Local_Part_Number": "KL-00123-A3F142" }) // Returns true
 * hasLPN({ "Value": "100k" }) // Returns false
 */
export function hasLPN(component) {
    return !!(component && component.Local_Part_Number && component.Local_Part_Number.trim());
}

/**
 * Checks if a field is the MPN field and should be locked from editing
 * @param {string} fieldName - Name of the field being edited
 * @param {object} component - Component object being edited
 * @returns {boolean} - True if field is locked (MPN field with assigned LPN)
 * 
 * @example
 * const component = { "Mfr. Part #": "RC0603", "Local_Part_Number": "KL-00123-A3F142" };
 * isFieldLocked("Mfr. Part #", component) // Returns true
 * isFieldLocked("Value", component) // Returns false
 */
export function isFieldLocked(fieldName, component) {
    // If no LPN assigned, nothing is locked
    if (!hasLPN(component)) {
        return false;
    }

    // List of MPN field names that should be locked
    const mpnFields = [
        'Mfr. Part #',
        'MPN',
        'Manufacturer Part Number',
        'Part Number',
        'PartNumber',
        'Part#'
    ];

    return mpnFields.includes(fieldName);
}