import { useState } from 'react';

export default function KiCadSchematicInfo({ schematicData, projectName }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!schematicData) return null;

    const { fileName, uploadDate, components, metadata } = schematicData;

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6 ring-1 ring-purple-500/20">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-purple-400">
                            KiCad Schematic Loaded
                        </h3>
                        <p className="text-sm text-gray-400">
                            {projectName}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg 
                        className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400 uppercase font-medium">File Name</span>
                    </div>
                    <p className="text-sm text-white font-mono truncate" title={fileName}>
                        {fileName}
                    </p>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-xs text-gray-400 uppercase font-medium">Components</span>
                    </div>
                    <p className="text-xl font-bold text-purple-400">
                        {components}
                    </p>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-gray-400 uppercase font-medium">Uploaded</span>
                    </div>
                    <p className="text-sm text-white">
                        {new Date(uploadDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {isExpanded && metadata && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Schematic Metadata</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries(metadata).map(([key, value]) => (
                            <div key={key} className="bg-gray-900/50 rounded px-3 py-2 border border-gray-700">
                                <span className="text-xs text-gray-400">{key}:</span>
                                <span className="text-sm text-white ml-2">{value || 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>KiCad integration active: Components can be copied with proper designator matching</span>
            </div>
        </div>
    );
}