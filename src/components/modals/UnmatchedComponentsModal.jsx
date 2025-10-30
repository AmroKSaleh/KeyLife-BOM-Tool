/**
 * @file UnmatchedComponentsModal.jsx
 * @description Modal displaying components that couldn't be matched with KiCad schematic
 */

import { useState } from 'react';

export default function UnmatchedComponentsModal({ 
    isOpen, 
    onClose, 
    unmatchedComponents, 
    projectName,
    syncParams 
}) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const components = unmatchedComponents[projectName] || [];
    
    const filteredComponents = components.filter(comp => {
        const searchLower = searchTerm.toLowerCase();
        return Object.values(comp).some(val => 
            String(val).toLowerCase().includes(searchLower)
        );
    });

    return (
        <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ring-1 ring-red-500/30">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Unmatched Components
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {components.length} component{components.length !== 1 ? 's' : ''} in {projectName} could not be matched with KiCad schematic
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

                {/* Search */}
                <div className="p-4 border-b border-gray-700">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search unmatched components..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <svg 
                            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="p-4 bg-blue-900/20 border-b border-blue-500/30">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-300">
                            <p className="font-medium mb-1">Why are these unmatched?</p>
                            <p className="text-blue-200/80">
                                These components couldn't be linked with the KiCad schematic using:
                            </p>
                            <ul className="list-disc ml-5 mt-1 space-y-0.5">
                                <li>Designator matching (primary method)</li>
                                {syncParams.map((param, i) => (
                                    <li key={i}>{param} matching</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Component List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredComponents.length === 0 ? (
                        <div className="text-center py-12">
                            {components.length === 0 ? (
                                <>
                                    <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg font-medium text-green-400 mb-1">
                                        All Components Matched!
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Every BOM component has been successfully linked with the KiCad schematic
                                    </p>
                                </>
                            ) : (
                                <>
                                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-gray-400">No results found for "{searchTerm}"</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredComponents.map((comp, index) => (
                                <div 
                                    key={comp.id || index}
                                    className="bg-gray-700/50 rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center">
                                                <span className="text-red-400 font-mono font-bold">
                                                    {comp.Designator || comp.Reference || '?'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {comp.Value || 'No Value'}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {comp.Description || comp.Footprint || 'No description'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-900/20 rounded">
                                            Unmatched
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Object.entries(comp)
                                            .filter(([key]) => key !== 'id' && key !== 'ProjectName' && comp[key])
                                            .slice(0, 6)
                                            .map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-2">
                                                    <span className="text-gray-500 text-xs">{key}:</span>
                                                    <span className="text-white text-xs font-mono truncate">
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                                Showing {filteredComponents.length} of {components.length} unmatched components
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}