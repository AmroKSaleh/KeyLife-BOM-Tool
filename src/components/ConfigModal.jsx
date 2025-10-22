import { useState, useEffect } from 'react';

export default function ConfigModal({ isOpen, onClose, onSave, currentConfig }) {
    const [activeTab, setActiveTab] = useState('designator');
    const [config, setConfig] = useState({
        designatorColumn: 'Designator',
        alternateDesignatorColumns: ['Reference', 'RefDes', 'Ref'],
        designatorMeanings: {
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
            'X': 'Crystal/Oscillator',
            'Y': 'Crystal',
            'BT': 'Battery',
            'TP': 'Test Point',
            'FID': 'Fiducial'
        },
        fieldMappings: {
            'Part Number': 'Mfr. Part #',
            'MPN': 'Mfr. Part #',
            'Part#': 'Mfr. Part #',
            'Reference': 'Designator',
            'Ref': 'Designator',
            'RefDes': 'Designator',
            'Qty': 'Quantity',
            'Description': 'Description',
            'Desc': 'Description',
            'Value': 'Value',
            'Package': 'Footprint',
            'Manufacturer': 'Manufacturer',
            'Mfr': 'Manufacturer'
        },
        kicadSyncParams: ['Datasheet', 'Mfr. Part #']
    });

    const [newPrefix, setNewPrefix] = useState('');
    const [newMeaning, setNewMeaning] = useState('');
    const [newFieldFrom, setNewFieldFrom] = useState('');
    const [newFieldTo, setNewFieldTo] = useState('');
    const [newSyncParam, setNewSyncParam] = useState('');
    const [newAltColumn, setNewAltColumn] = useState('');

    useEffect(() => {
        if (currentConfig) {
            setConfig(currentConfig);
        }
    }, [currentConfig]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'designator', label: 'Designator Column', icon: '🔗' },
        { id: 'meanings', label: 'Designator Meanings', icon: '🏷️' },
        { id: 'fields', label: 'Field Mappings', icon: '🗂️' },
        { id: 'kicad', label: 'KiCad Sync', icon: '⚡' }
    ];

    const handleSave = () => {
        onSave(config);
        onClose();
    };

    const addDesignatorMeaning = () => {
        if (newPrefix && newMeaning) {
            setConfig(prev => ({
                ...prev,
                designatorMeanings: {
                    ...prev.designatorMeanings,
                    [newPrefix]: newMeaning
                }
            }));
            setNewPrefix('');
            setNewMeaning('');
        }
    };

    const removeDesignatorMeaning = (prefix) => {
        setConfig(prev => {
            const newMeanings = { ...prev.designatorMeanings };
            delete newMeanings[prefix];
            return { ...prev, designatorMeanings: newMeanings };
        });
    };

    const addFieldMapping = () => {
        if (newFieldFrom && newFieldTo) {
            setConfig(prev => ({
                ...prev,
                fieldMappings: {
                    ...prev.fieldMappings,
                    [newFieldFrom]: newFieldTo
                }
            }));
            setNewFieldFrom('');
            setNewFieldTo('');
        }
    };

    const removeFieldMapping = (from) => {
        setConfig(prev => {
            const newMappings = { ...prev.fieldMappings };
            delete newMappings[from];
            return { ...prev, fieldMappings: newMappings };
        });
    };

    const addSyncParam = () => {
        if (newSyncParam && !config.kicadSyncParams.includes(newSyncParam)) {
            setConfig(prev => ({
                ...prev,
                kicadSyncParams: [...prev.kicadSyncParams, newSyncParam]
            }));
            setNewSyncParam('');
        }
    };

    const removeSyncParam = (param) => {
        setConfig(prev => ({
            ...prev,
            kicadSyncParams: prev.kicadSyncParams.filter(p => p !== param)
        }));
    };

    const moveSyncParam = (index, direction) => {
        setConfig(prev => {
            const newParams = [...prev.kicadSyncParams];
            const newIndex = index + direction;
            if (newIndex >= 0 && newIndex < newParams.length) {
                [newParams[index], newParams[newIndex]] = [newParams[newIndex], newParams[index]];
            }
            return { ...prev, kicadSyncParams: newParams };
        });
    };

    const addAlternateColumn = () => {
        if (newAltColumn && !config.alternateDesignatorColumns.includes(newAltColumn)) {
            setConfig(prev => ({
                ...prev,
                alternateDesignatorColumns: [...prev.alternateDesignatorColumns, newAltColumn]
            }));
            setNewAltColumn('');
        }
    };

    const removeAlternateColumn = (column) => {
        setConfig(prev => ({
            ...prev,
            alternateDesignatorColumns: prev.alternateDesignatorColumns.filter(c => c !== column)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ring-1 ring-keylife-accent/30">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Configuration</h2>
                        <p className="text-sm text-gray-400 mt-1">Customize BOM processing and KiCad integration</p>
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

                {/* Tabs */}
                <div className="flex border-b border-gray-700 px-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-keylife-accent text-keylife-accent'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Designator Column Tab */}
                    {activeTab === 'designator' && (
                        <div className="space-y-6">
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-300">
                                        <p className="font-medium mb-2">Why is this important?</p>
                                        <p>The designator column (e.g., R1, C5, U3) is <strong>critical</strong> for linking your BOM components with KiCad schematic symbols. If your CSV/Excel files use different column names, specify them here.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Primary Designator Column Name
                                </label>
                                <input
                                    type="text"
                                    value={config.designatorColumn}
                                    onChange={(e) => setConfig(prev => ({ ...prev, designatorColumn: e.target.value }))}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-keylife-accent"
                                    placeholder="e.g., Designator, Reference, RefDes"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    This is the main column name the tool will look for in your BOM files
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Alternate Column Names
                                </label>
                                <p className="text-xs text-gray-400 mb-3">
                                    If the primary column isn't found, these alternates will be checked in order
                                </p>
                                
                                <div className="space-y-2 mb-3">
                                    {config.alternateDesignatorColumns.map((column, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                                                <span className="text-white font-mono">{column}</span>
                                            </div>
                                            <button
                                                onClick={() => removeAlternateColumn(column)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                title="Remove"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newAltColumn}
                                        onChange={(e) => setNewAltColumn(e.target.value)}
                                        placeholder="Column name (e.g., Ref, Part)"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-keylife-accent"
                                        onKeyPress={(e) => e.key === 'Enter' && addAlternateColumn()}
                                    />
                                    <button
                                        onClick={addAlternateColumn}
                                        className="bg-keylife-accent hover:bg-keylife-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Example:</h4>
                                <p className="text-sm text-gray-400 mb-2">
                                    If your BOM has a column called "Part Reference", you should:
                                </p>
                                <ol className="text-sm text-gray-400 space-y-1 ml-4 list-decimal">
                                    <li>Set it as the Primary Designator Column, OR</li>
                                    <li>Add it as an Alternate Column Name</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Designator Meanings Tab */}
                    {activeTab === 'meanings' && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-400 mb-4">
                                    Define what each designator prefix means (e.g., R = Resistor, C = Capacitor)
                                </p>
                                
                                <div className="grid gap-2 mb-4">
                                    {Object.entries(config.designatorMeanings).map(([prefix, meaning]) => (
                                        <div key={prefix} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-bold text-keylife-accent">{prefix}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-white">{meaning}</span>
                                            </div>
                                            <button
                                                onClick={() => removeDesignatorMeaning(prefix)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newPrefix}
                                        onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                                        placeholder="Prefix (e.g., R, IC)"
                                        className="w-32 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-keylife-accent"
                                    />
                                    <input
                                        type="text"
                                        value={newMeaning}
                                        onChange={(e) => setNewMeaning(e.target.value)}
                                        placeholder="Meaning (e.g., Resistor)"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-keylife-accent"
                                        onKeyPress={(e) => e.key === 'Enter' && addDesignatorMeaning()}
                                    />
                                    <button
                                        onClick={addDesignatorMeaning}
                                        className="bg-keylife-accent hover:bg-keylife-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Field Mappings Tab */}
                    {activeTab === 'fields' && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-400 mb-4">
                                    Map different column names in your BOM files to standard field names
                                </p>
                                
                                <div className="grid gap-2 mb-4">
                                    {Object.entries(config.fieldMappings).map(([from, to]) => (
                                        <div key={from} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-white font-mono">{from}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-keylife-accent font-mono">{to}</span>
                                            </div>
                                            <button
                                                onClick={() => removeFieldMapping(from)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newFieldFrom}
                                        onChange={(e) => setNewFieldFrom(e.target.value)}
                                        placeholder="Original field name"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-keylife-accent"
                                    />
                                    <span className="text-gray-400 flex items-center">→</span>
                                    <input
                                        type="text"
                                        value={newFieldTo}
                                        onChange={(e) => setNewFieldTo(e.target.value)}
                                        placeholder="Standard field name"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-keylife-accent"
                                        onKeyPress={(e) => e.key === 'Enter' && addFieldMapping()}
                                    />
                                    <button
                                        onClick={addFieldMapping}
                                        className="bg-keylife-accent hover:bg-keylife-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* KiCad Sync Tab */}
                    {activeTab === 'kicad' && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-400 mb-4">
                                    Configure which fields to use for matching BOM components with KiCad symbols (priority order)
                                </p>
                                
                                <div className="space-y-2 mb-4">
                                    {config.kicadSyncParams.map((param, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                                                <span className="text-white font-mono">{param}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => moveSyncParam(index, -1)}
                                                    disabled={index === 0}
                                                    className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="Move up"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => moveSyncParam(index, 1)}
                                                    disabled={index === config.kicadSyncParams.length - 1}
                                                    className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="Move down"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => removeSyncParam(param)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                    title="Remove"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSyncParam}
                                        onChange={(e) => setNewSyncParam(e.target.value)}
                                        placeholder="Field name (e.g., Datasheet, MPN)"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-keylife-accent"
                                        onKeyPress={(e) => e.key === 'Enter' && addSyncParam()}
                                    />
                                    <button
                                        onClick={addSyncParam}
                                        className="bg-keylife-accent hover:bg-keylife-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mt-4">
                                    <p className="text-sm text-gray-400">
                                        <strong className="text-white">Note:</strong> The tool will try to match BOM components with KiCad symbols using these fields in the order listed above. The designator ({config.designatorColumn}) is always checked first.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 p-6 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-keylife-accent hover:bg-keylife-accent/80 text-white font-medium px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}