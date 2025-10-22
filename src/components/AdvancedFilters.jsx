/**
 * @file AdvancedFilters.jsx
 * @description Advanced filtering with component type detection and multi-project selection
 * @author Amro K. Saleh
 */

import { useState, useMemo } from 'react';

const DEFAULT_DESIGNATOR_MAP = {
    'R': 'Resistor',
    'C': 'Capacitor',
    'L': 'Inductor',
    'D': 'Diode',
    'Q': 'Transistor',
    'U': 'IC',
    'J': 'Connector',
    'SW': 'Switch',
    'F': 'Fuse',
    'T': 'Transformer',
    'K': 'Relay',
    'X': 'Crystal',
    'Y': 'Crystal',
    'BT': 'Battery',
    'P': 'Connector',
    'TP': 'Test Point',
    'FB': 'Ferrite Bead',
    'RN': 'Resistor Network'
};

export default function AdvancedFilters({
    components,
    selectedProjects,
    setSelectedProjects,
    selectedComponentTypes,
    setSelectedComponentTypes,
    designatorMap,
    setDesignatorMap,
    onSaveDesignatorMap
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingMap, setIsEditingMap] = useState(false);
    const [editedMap, setEditedMap] = useState({});

    // Extract all unique projects
    const projectNames = useMemo(() => 
        [...new Set(components.map(c => c.ProjectName))].sort(),
        [components]
    );

    // Detect component types from designators
    const componentTypes = useMemo(() => {
        const types = new Map();
        const currentMap = designatorMap || DEFAULT_DESIGNATOR_MAP;
        
        components.forEach(comp => {
            const designator = comp.Designator || comp.Reference || '';
            const prefix = designator.match(/^([A-Z]+)/)?.[1];
            
            if (prefix && currentMap[prefix]) {
                const typeName = currentMap[prefix];
                types.set(typeName, (types.get(typeName) || 0) + 1);
            }
        });
        
        return Array.from(types.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [components, designatorMap]);

    const toggleProject = (projectName) => {
        setSelectedProjects(prev => {
            if (prev.includes(projectName)) {
                return prev.filter(p => p !== projectName);
            } else {
                return [...prev, projectName];
            }
        });
    };

    const toggleComponentType = (typeName) => {
        setSelectedComponentTypes(prev => {
            if (prev.includes(typeName)) {
                return prev.filter(t => t !== typeName);
            } else {
                return [...prev, typeName];
            }
        });
    };

    const selectAllProjects = () => {
        setSelectedProjects([...projectNames]);
    };

    const clearAllProjects = () => {
        setSelectedProjects([]);
    };

    const selectAllTypes = () => {
        setSelectedComponentTypes(componentTypes.map(t => t.name));
    };

    const clearAllTypes = () => {
        setSelectedComponentTypes([]);
    };

    const startEditingMap = () => {
        setEditedMap(designatorMap || DEFAULT_DESIGNATOR_MAP);
        setIsEditingMap(true);
    };

    const saveDesignatorMap = () => {
        setDesignatorMap(editedMap);
        if (onSaveDesignatorMap) {
            onSaveDesignatorMap(editedMap);
        }
        setIsEditingMap(false);
    };

    const cancelEditingMap = () => {
        setEditedMap({});
        setIsEditingMap(false);
    };

    const addDesignatorMapping = () => {
        const prefix = prompt('Enter designator prefix (e.g., R, C, U):');
        if (!prefix) return;
        
        const type = prompt(`Enter component type for "${prefix}":`);
        if (!type) return;
        
        setEditedMap(prev => ({ ...prev, [prefix.toUpperCase()]: type }));
    };

    const removeDesignatorMapping = (prefix) => {
        setEditedMap(prev => {
            const newMap = { ...prev };
            delete newMap[prefix];
            return newMap;
        });
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 ring-1 ring-keylife-accent/20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-keylife-accent flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Advanced Filters
                </h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg 
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-6">
                    {/* Multi-Project Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-300">
                                Filter by Projects ({selectedProjects.length}/{projectNames.length})
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllProjects}
                                    className="text-xs text-keylife-accent hover:text-keylife-accent/80"
                                >
                                    Select All
                                </button>
                                <span className="text-gray-600">|</span>
                                <button
                                    onClick={clearAllProjects}
                                    className="text-xs text-gray-400 hover:text-white"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
                            {projectNames.map(project => (
                                <label
                                    key={project}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-700/50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProjects.includes(project)}
                                        onChange={() => toggleProject(project)}
                                        className="w-4 h-4 text-keylife-accent bg-gray-700 border-gray-600 rounded focus:ring-keylife-accent focus:ring-2"
                                    />
                                    <span className="text-sm text-gray-300 truncate">{project}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Component Type Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-300">
                                Filter by Component Type ({selectedComponentTypes.length}/{componentTypes.length})
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllTypes}
                                    className="text-xs text-keylife-accent hover:text-keylife-accent/80"
                                >
                                    Select All
                                </button>
                                <span className="text-gray-600">|</span>
                                <button
                                    onClick={clearAllTypes}
                                    className="text-xs text-gray-400 hover:text-white"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
                            {componentTypes.map(({ name, count }) => (
                                <label
                                    key={name}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-700/50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedComponentTypes.includes(name)}
                                        onChange={() => toggleComponentType(name)}
                                        className="w-4 h-4 text-keylife-accent bg-gray-700 border-gray-600 rounded focus:ring-keylife-accent focus:ring-2"
                                    />
                                    <span className="text-sm text-gray-300">
                                        {name} ({count})
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Designator Mapping */}
                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-300">
                                Designator Mapping
                            </label>
                            {!isEditingMap ? (
                                <button
                                    onClick={startEditingMap}
                                    className="text-xs bg-keylife-accent hover:bg-keylife-accent/80 text-white px-3 py-1 rounded transition-colors"
                                >
                                    Edit Mapping
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={saveDesignatorMap}
                                        className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={cancelEditingMap}
                                        className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {isEditingMap ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
                                    {Object.entries(editedMap).map(([prefix, type]) => (
                                        <div key={prefix} className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                                            <span className="text-keylife-accent font-mono font-bold">{prefix}</span>
                                            <span className="text-gray-400">→</span>
                                            <input
                                                type="text"
                                                value={type}
                                                onChange={(e) => setEditedMap(prev => ({ ...prev, [prefix]: e.target.value }))}
                                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-keylife-accent"
                                            />
                                            <button
                                                onClick={() => removeDesignatorMapping(prefix)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addDesignatorMapping}
                                    className="w-full text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Mapping
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-gray-900/50 rounded-lg text-xs">
                                {Object.entries(designatorMap || DEFAULT_DESIGNATOR_MAP).slice(0, 12).map(([prefix, type]) => (
                                    <div key={prefix} className="flex items-center gap-2 text-gray-400">
                                        <span className="text-keylife-accent font-mono font-bold">{prefix}</span>
                                        <span>→</span>
                                        <span>{type}</span>
                                    </div>
                                ))}
                                {Object.keys(designatorMap || DEFAULT_DESIGNATOR_MAP).length > 12 && (
                                    <div className="text-gray-500 italic">
                                        +{Object.keys(designatorMap || DEFAULT_DESIGNATOR_MAP).length - 12} more...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}