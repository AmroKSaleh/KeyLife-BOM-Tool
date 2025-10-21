/**
 * @file DataTable.jsx
 * @description Enhanced data table with better filtering, search, and UX
 */

import { useMemo } from 'react';

export default function DataTable({ 
    components, 
    headers, 
    selectedProject, 
    setSelectedProject, 
    searchTerm, 
    setSearchTerm, 
    findAlternatives, 
    clearLibrary, 
    exportLibrary 
}) {
    const projectNames = useMemo(() => 
        [...new Set(components.map(c => c.ProjectName))].sort(),
        [components]
    );

    const filteredComponents = useMemo(() => {
        let filtered = components;

        if (selectedProject) {
            filtered = filtered.filter(c => c.ProjectName === selectedProject);
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(component => {
                return Object.keys(component).some(key =>
                    String(component[key]).toLowerCase().includes(lowercasedFilter)
                );
            });
        }
        
        return filtered;
    }, [components, searchTerm, selectedProject]);

    const stats = useMemo(() => ({
        total: components.length,
        filtered: filteredComponents.length,
        projects: projectNames.length
    }), [components.length, filteredComponents.length, projectNames.length]);

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 ring-1 ring-keylife-accent/20">
            {/* Header & Stats */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-keylife-accent">
                            Component Library
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Showing {stats.filtered} of {stats.total} components
                            {stats.projects > 0 && ` • ${stats.projects} project${stats.projects !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        {/* Project Filter */}
                        <div className="relative w-full md:w-48">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-keylife-accent transition duration-200 appearance-none cursor-pointer"
                            >
                                <option value="">All Projects</option>
                                {projectNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <svg 
                                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search components..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keylife-accent transition duration-200"
                            />
                            <svg 
                                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Filters */}
                {(selectedProject || searchTerm) && (
                    <div className="flex flex-wrap gap-2">
                        {selectedProject && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-keylife-accent/20 text-keylife-accent rounded-full text-sm">
                                Project: {selectedProject}
                                <button onClick={() => setSelectedProject('')} className="hover:text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </span>
                        )}
                        {searchTerm && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-keylife-accent/20 text-keylife-accent rounded-full text-sm">
                                Search: "{searchTerm}"
                                <button onClick={() => setSearchTerm('')} className="hover:text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>
            
            {/* Component Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-keylife-accent uppercase bg-gray-900">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                            <th scope="col" className="px-6 py-3 text-center whitespace-nowrap">
                                AI Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredComponents.map((component, index) => (
                            <tr 
                                key={component.id || index} 
                                className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                            >
                                {headers.map((header) => (
                                    <td key={header} className="px-6 py-4 whitespace-nowrap">
                                        {component[header] || '-'}
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => findAlternatives(component)} 
                                        className="bg-keylife-accent hover:bg-keylife-accent/80 text-white font-medium py-1.5 px-4 rounded-lg text-sm transition duration-200 inline-flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Find Alternatives
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredComponents.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">No components found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-6 pt-6 border-t border-gray-700">
                <button 
                    onClick={exportLibrary} 
                    className="w-full sm:w-auto bg-keylife-accent hover:bg-keylife-accent/80 text-white font-medium py-2 px-4 rounded-lg transition duration-200 inline-flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Library
                </button>
                <button 
                    onClick={clearLibrary} 
                    className="w-full sm:w-auto bg-red-700 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 inline-flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Library
                </button>
            </div>
        </div>
    );
}