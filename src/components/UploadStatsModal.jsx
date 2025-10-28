/**
 * @file UploadStatsModal.jsx
 * @description Shows upload statistics and handles duplicate conflicts
 */

import { useState } from 'react';

export default function UploadStatsModal({ 
    isOpen, 
    onClose, 
    stats,
    onResolveConflicts 
}) {
    const [resolutions, setResolutions] = useState({});

    if (!isOpen || !stats) return null;

    const hasDuplicates = stats.duplicates && stats.duplicates.length > 0;

    const handleResolutionChange = (mpn, resolution) => {
        setResolutions(prev => ({
            ...prev,
            [mpn]: resolution
        }));
    };

    const handleSubmit = () => {
        if (hasDuplicates) {
            onResolveConflicts(resolutions);
        } else {
            onClose();
        }
    };

    const allResolved = hasDuplicates 
        ? stats.duplicates.every(dup => resolutions[dup.mpn])
        : true;

    return (
        <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && !hasDuplicates && onClose()}
        >
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto ring-1 ring-keylife-accent/30">
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {hasDuplicates ? '⚠️ Upload Conflicts Detected' : '✅ Upload Complete'}
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {hasDuplicates 
                                    ? 'Please resolve duplicate components before continuing'
                                    : 'Components successfully processed'
                                }
                            </p>
                        </div>
                        {!hasDuplicates && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-green-400">
                                {stats.newComponents || 0}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">New Components</div>
                        </div>
                        
                        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-yellow-400">
                                {stats.duplicates?.length || 0}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">Duplicates Found</div>
                        </div>

                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-blue-400">
                                {stats.totalParsed || 0}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">Total Parsed</div>
                        </div>
                    </div>

                    {/* Duplicate Resolution */}
                    {hasDuplicates && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Resolve Conflicts
                            </h3>
                            
                            <div className="space-y-4">
                                {stats.duplicates.map((duplicate, idx) => (
                                    <div 
                                        key={idx}
                                        className="bg-gray-900/50 border border-yellow-700/30 rounded-lg p-4"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="font-medium text-white mb-1">
                                                    {duplicate.newComponent.Designator}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    MPN: <span className="text-yellow-400">{duplicate.mpn}</span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded">
                                                Duplicate
                                            </span>
                                        </div>

                                        {/* Comparison */}
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            {/* Existing Component */}
                                            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                                                <div className="text-xs text-gray-400 uppercase mb-2 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                                    </svg>
                                                    Existing in Library
                                                </div>
                                                <div className="text-sm space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Designator:</span>
                                                        <span className="text-white">{duplicate.existingComponent.Designator}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Value:</span>
                                                        <span className="text-white">{duplicate.existingComponent.Value || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Qty:</span>
                                                        <span className="text-white">{duplicate.existingComponent.Quantity || duplicate.existingComponent.Qty || '1'}</span>
                                                    </div>
                                                    {duplicate.existingComponent.Local_Part_Number && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">LPN:</span>
                                                            <span className="text-green-400 font-mono text-xs">
                                                                {duplicate.existingComponent.Local_Part_Number}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* New Component */}
                                            <div className="bg-gray-800 rounded-lg p-3 border border-keylife-accent/30">
                                                <div className="text-xs text-gray-400 uppercase mb-2 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                    New from Upload
                                                </div>
                                                <div className="text-sm space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Designator:</span>
                                                        <span className="text-white">{duplicate.newComponent.Designator}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Value:</span>
                                                        <span className="text-white">{duplicate.newComponent.Value || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Qty:</span>
                                                        <span className="text-white">{duplicate.newComponent.Quantity || duplicate.newComponent.Qty || '1'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Resolution Options */}
                                        <div className="space-y-2">
                                            <div className="text-sm text-gray-400 mb-2">Choose action:</div>
                                            
                                            <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-keylife-accent/50 cursor-pointer transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`resolution-${idx}`}
                                                    value="merge"
                                                    checked={resolutions[duplicate.mpn] === 'merge'}
                                                    onChange={(e) => handleResolutionChange(duplicate.mpn, e.target.value)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-white">Merge & Update Quantity</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Keep existing component, add quantities together
                                                    </div>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-keylife-accent/50 cursor-pointer transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`resolution-${idx}`}
                                                    value="separate"
                                                    checked={resolutions[duplicate.mpn] === 'separate'}
                                                    onChange={(e) => handleResolutionChange(duplicate.mpn, e.target.value)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-white">Keep Separate</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Create new component with different LPN
                                                    </div>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-red-500/50 cursor-pointer transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`resolution-${idx}`}
                                                    value="skip"
                                                    checked={resolutions[duplicate.mpn] === 'skip'}
                                                    onChange={(e) => handleResolutionChange(duplicate.mpn, e.target.value)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-white">Skip Import</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Don't import this component
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6">
                    <div className="flex justify-end gap-3">
                        {hasDuplicates && (
                            <button
                                onClick={() => {
                                    // Auto-select "merge" for all
                                    const autoResolutions = {};
                                    stats.duplicates.forEach(dup => {
                                        autoResolutions[dup.mpn] = 'merge';
                                    });
                                    setResolutions(autoResolutions);
                                }}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Merge All
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!allResolved}
                            className="bg-keylife-accent hover:bg-keylife-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
                        >
                            {hasDuplicates ? 'Apply Resolutions' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}