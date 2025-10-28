/**
 * @file AmbiguousQtyModal.jsx
 * @description Modal for resolving BOM rows with ambiguous quantities
 * (e.g., multiple designators listed but Quantity > 1).
 */

import { useState, useEffect } from 'react';

// Default resolution if user doesn't explicitly choose
const DEFAULT_RESOLUTION = 'flatten'; // Or 'keep' or 'skip' based on desired default

export default function AmbiguousQtyModal({
    isOpen,
    onClose,
    ambiguousComponents = [], // Array of components flagged with _ambiguousQty
    projectName,
    onResolve // Function to call with resolved data: (resolvedComponents) => {}
}) {
    // State to track the chosen resolution for each ambiguous component
    // Key: component.id, Value: 'flatten' | 'keep' | 'skip'
    const [resolutions, setResolutions] = useState({});

    // Initialize resolutions when components change
    useEffect(() => {
        if (isOpen && ambiguousComponents.length > 0) {
            const initialResolutions = {};
            // You might pre-select a default here if desired, otherwise leave empty
            // ambiguousComponents.forEach(comp => {
            //     initialResolutions[comp.id] = DEFAULT_RESOLUTION;
            // });
            setResolutions(initialResolutions);
        } else {
            setResolutions({}); // Reset when modal closes or components are empty
        }
    }, [isOpen, ambiguousComponents]);

    if (!isOpen || ambiguousComponents.length === 0) return null;

    // Check if all ambiguous components have a resolution selected
    const allResolved = ambiguousComponents.every(comp => resolutions[comp.id]);

    // Handle selecting a resolution for a component
    const handleResolutionChange = (componentId, resolution) => {
        setResolutions(prev => ({
            ...prev,
            [componentId]: resolution
        }));
    };

    // Apply the chosen resolutions and pass the processed data back
    const handleApplyResolutions = () => {
        const resolvedComponents = [];

        ambiguousComponents.forEach(originalComp => {
            const resolution = resolutions[originalComp.id];
            const potentialDesignators = originalComp._potentialDesignators || [];
            const qtyColumn = originalComp._qtyColumnName; // Get the original Qty column name

            if (resolution === 'flatten') {
                // Create multiple components, one for each designator, setting Qty to 1
                potentialDesignators.forEach((designator, index) => {
                    // Create a unique ID for the flattened component
                    const newId = `${originalComp.ProjectName}-${designator}-${Date.now()}-flat-${index}`;
                    const newComp = { ...originalComp, id: newId };
                    // Remove internal flags
                    delete newComp._ambiguousQty;
                    delete newComp._potentialDesignators;
                    delete newComp._originalQty;
                    delete newComp._qtyColumnName;

                    // Set the specific designator for this instance
                    newComp.Designator = designator; // Assuming 'Designator' is the standard field
                    if (originalComp.Reference) newComp.Reference = designator; // Update common alternates too
                    if (originalComp.RefDes) newComp.RefDes = designator;
                    if (originalComp.Ref) newComp.Ref = designator;

                    // Set quantity to 1 using the original quantity column name
                    if (qtyColumn) {
                        newComp[qtyColumn] = '1';
                    } else {
                         // If somehow qtyColumn wasn't found (shouldn't happen for ambiguous), add a default Qty=1
                         newComp.Quantity = '1'; // Or use 'Qty' based on your standard
                    }

                    resolvedComponents.push(newComp);
                });
            } else if (resolution === 'keep') {
                // Keep the component as is, just remove the internal flags
                const keptComp = { ...originalComp };
                delete keptComp._ambiguousQty;
                delete keptComp._potentialDesignators;
                delete keptComp._originalQty;
                delete keptComp._qtyColumnName;
                resolvedComponents.push(keptComp);
            }
            // If resolution === 'skip', do nothing (don't add to resolvedComponents)
        });

        onResolve(resolvedComponents); // Pass the processed list back
        onClose(); // Close the modal
    };

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()} // Close on backdrop click
        >
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ring-1 ring-yellow-500/30">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Resolve Quantity Conflicts
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {ambiguousComponents.length} row(s) in '{projectName}' need clarification.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Info Banner */}
                 <div className="p-4 bg-yellow-900/20 border-b border-yellow-500/30">
                    <p className="text-sm text-yellow-300">
                        These rows list multiple designators but also have a quantity greater than 1. Please choose how to interpret them.
                    </p>
                </div>

                {/* Component List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {ambiguousComponents.map((comp, index) => {
                        const designators = comp._potentialDesignators || [];
                        const designatorCount = designators.length;
                        const listedQty = comp._originalQty || comp[comp._qtyColumnName || 'Qty'] || 'N/A';

                        return (
                            <div
                                key={comp.id || index}
                                className="bg-gray-700/50 rounded-lg p-4 border border-yellow-500/30"
                            >
                                {/* Component Info */}
                                <div className="flex flex-col md:flex-row md:items-start justify-between mb-3">
                                    <div className="mb-2 md:mb-0">
                                        <div className="font-mono text-white mb-1 break-all" title={comp.Designator}>
                                            Designators: <span className="text-yellow-400">{comp.Designator}</span> ({designatorCount} found)
                                        </div>
                                         <div className="text-sm text-gray-400">
                                            Listed Quantity: <span className="text-yellow-400 font-bold">{listedQty}</span>
                                            {/* Highlight mismatch */}
                                            {parseInt(listedQty, 10) !== designatorCount && !isNaN(parseInt(listedQty, 10)) && (
                                                <span className="text-red-400 ml-2">(Mismatch!)</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Value: {comp.Value || '-'} | MPN: {comp['Mfr. Part #'] || comp.MPN || '-'}
                                        </div>
                                    </div>
                                    <span className="text-xs text-yellow-400 font-medium px-2 py-1 bg-yellow-900/20 rounded self-start">
                                        Needs Resolution
                                    </span>
                                </div>

                                {/* Resolution Options */}
                                <div className="space-y-2">
                                    <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-keylife-accent/50 cursor-pointer transition-colors">
                                        <input
                                            type="radio"
                                            name={`resolution-${comp.id}`}
                                            value="flatten"
                                            checked={resolutions[comp.id] === 'flatten'}
                                            onChange={(e) => handleResolutionChange(comp.id, e.target.value)}
                                            className="mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-white">Flatten to {designatorCount} Components</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Create {designatorCount} separate entries, each with Quantity = 1.
                                                <span className="text-gray-500 block"> (Treats listed quantity '{listedQty}' as incorrect)</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-keylife-accent/50 cursor-pointer transition-colors">
                                        <input
                                            type="radio"
                                            name={`resolution-${comp.id}`}
                                            value="keep"
                                            checked={resolutions[comp.id] === 'keep'}
                                            onChange={(e) => handleResolutionChange(comp.id, e.target.value)}
                                            className="mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-white">Keep As Single Entry</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Import as one component with Designator "{comp.Designator}" and Quantity = {listedQty}.
                                                <span className="text-gray-500 block"> (Assumes designators represent a group/pack)</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-red-500/50 cursor-pointer transition-colors">
                                        <input
                                            type="radio"
                                            name={`resolution-${comp.id}`}
                                            value="skip"
                                            checked={resolutions[comp.id] === 'skip'}
                                            onChange={(e) => handleResolutionChange(comp.id, e.target.value)}
                                            className="mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-white">Skip This Row</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Do not import this component row from the file.
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 p-6 flex justify-between items-center bg-gray-900/50">
                     <p className="text-sm text-gray-400">
                        {Object.keys(resolutions).length} / {ambiguousComponents.length} resolved
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Cancel Upload
                        </button>
                        <button
                            onClick={handleApplyResolutions}
                            disabled={!allResolved}
                            className="bg-keylife-accent hover:bg-keylife-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
                        >
                            Apply Resolutions ({Object.keys(resolutions).length})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

