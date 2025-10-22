import { useState, useEffect } from 'react';
import { useBOMData } from './hooks/useBOMData.js';
import { useGeminiAI } from './hooks/useGeminiAI.js';
import { useKiCadParser } from './hooks/useKiCadParser.js';
import AiModal from './components/AiModal.jsx';
import SetupSection from './components/SetupSection.jsx';
import DataTable from './components/DataTable.jsx';
import ProjectManager from './components/ProjectManager.jsx';
import ConfigModal from './components/ConfigModal.jsx';
import UnmatchedComponentsModal from './components/UnmatchedComponentsModal.jsx';
import KiCadSchematicInfo from './components/KiCadSchematicInfo.jsx';

export default function App() {
    // Configuration state
    const [isConfigOpen, setIsConfigOpen] = useState(false);
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
            'LED': 'LED',
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

    // Load config from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('bomToolConfig');
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (err) {
                console.error('Failed to load config:', err);
            }
        }
    }, []);

    // Save config to localStorage
    useEffect(() => {
        localStorage.setItem('bomToolConfig', JSON.stringify(config));
    }, [config]);

    // BOM Data Hook
    const { 
        projectName,
        setProjectName,
        components,
        headers,
        error,
        setError,
        fileName,
        isProcessing,
        handleFileUpload,
        clearLibrary,
        exportLibrary,
        editComponent,
        deleteComponent,
        deleteProject,
        saveLibraryToFile,
        importLibrary
    } = useBOMData(config);
    
    // AI Hook
    const { 
        isModalOpen,
        setIsModalOpen,
        modalContent,
        isLoadingAi,
        findAlternatives 
    } = useGeminiAI();

    // KiCad Hook
    const {
        kicadSchematics,
        isParsingKiCad,
        kicadError,
        setKicadError,
        syncParams,
        setSyncParams,
        unmatchedComponents,
        parseKiCadSchematic,
        matchWithKiCad,
        generateKiCadComponent,
        autoLinkWithBOM,
        copyKiCadSymbolToClipboard
    } = useKiCadParser();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [isUnmatchedModalOpen, setIsUnmatchedModalOpen] = useState(false);

    // Auto-link when both BOM and schematic are available
    useEffect(() => {
        if (projectName && kicadSchematics[projectName] && components.length > 0) {
            const { matched, unmatched } = autoLinkWithBOM(components, projectName);
            
            if (unmatched.length > 0) {
                console.log(`Auto-linked ${matched.length} components, ${unmatched.length} unmatched`);
            }
        }
    }, [projectName, kicadSchematics, components, autoLinkWithBOM]);

    // Handle KiCad file upload
    const handleKiCadUpload = async (file) => {
        if (!projectName.trim()) {
            setKicadError('Please enter a project name first');
            return;
        }

        await parseKiCadSchematic(file, projectName);
        
        // Auto-link after schematic upload
        if (components.length > 0) {
            const { matched, unmatched } = autoLinkWithBOM(components, projectName);
            if (unmatched.length > 0) {
                setKicadError(
                    `✓ Schematic loaded. ${matched.length} matched, ${unmatched.length} unmatched. Click to view unmatched →`
                );
            }
        }
    };

    // Handle configuration save
    const handleConfigSave = (newConfig) => {
        setConfig(newConfig);
        setSyncParams(newConfig.kicadSyncParams);
        setError('✓ Configuration saved successfully');
        setTimeout(() => setError(''), 3000);
    };

    return (
        <div className="text-gray-100 min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                {/* Header with Logo and Settings */}
                <header className="text-center mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1"></div>
                        
                        <div className="flex-1 flex items-center justify-center gap-4">
                            <img 
                                src="/src/img/keylife-logo-white.png" 
                                alt="KeyLife Electronics Logo" 
                                className="h-16 md:h-20 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>

                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={() => setIsConfigOpen(true)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                                title="Configuration"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="hidden md:inline">Settings</span>
                            </button>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-keylife-accent mb-2">
                        BOM Consolidation Tool
                    </h1>
                    <p className="text-lg text-gray-400">
                        Upload, Search, and Manage Component Libraries with AI
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                        v0.1.0 Beta • KeyLife Electronics R&D
                    </div>
                </header>

                <main>
                    {/* Setup Section with KiCad Upload */}
                    <SetupSection 
                        projectName={projectName}
                        setProjectName={setProjectName}
                        fileName={fileName}
                        handleFileUpload={handleFileUpload}
                        isProcessing={isProcessing}
                        onKiCadUpload={handleKiCadUpload}
                        isParsingKiCad={isParsingKiCad}
                        kicadError={kicadError}
                        kicadSchematics={kicadSchematics}
                    />
                    
                    {/* Error/Success Messages */}
                    {error && (
                        <div 
                            className={`${
                                error.startsWith('✓') 
                                    ? 'bg-green-900/50 border-green-700 text-green-300' 
                                    : 'bg-red-900/50 border-red-700 text-red-300'
                            } border px-4 py-3 rounded-lg relative mb-6 flex items-start gap-3`}
                            role="alert"
                        >
                            <svg 
                                className="w-5 h-5 flex-shrink-0 mt-0.5" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                            >
                                {error.startsWith('✓') ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                )}
                            </svg>
                            <div className="flex-1">
                                <span className="font-medium">
                                    {error.startsWith('✓') ? 'Success' : 'Error'}:
                                </span>
                                <span className="block sm:inline ml-1">{error.replace('✓ ', '')}</span>
                            </div>
                            <button
                                onClick={() => setError('')}
                                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="bg-blue-900/30 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                            <span>Processing file...</span>
                        </div>
                    )}

                    {/* KiCad Schematic Info */}
                    {projectName && kicadSchematics[projectName] && (
                        <KiCadSchematicInfo
                            schematicData={kicadSchematics[projectName]}
                            projectName={projectName}
                        />
                    )}

                    {/* Show unmatched components alert */}
                    {projectName && unmatchedComponents[projectName]?.length > 0 && (
                        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <span className="font-medium">Warning:</span>
                                <span className="ml-1">
                                    {unmatchedComponents[projectName].length} component{unmatchedComponents[projectName].length !== 1 ? 's' : ''} could not be matched with KiCad schematic.
                                </span>
                                <button
                                    onClick={() => setIsUnmatchedModalOpen(true)}
                                    className="ml-2 text-yellow-200 underline hover:text-yellow-100"
                                >
                                    View unmatched →
                                </button>
                            </div>
                        </div>
                    )}

                    {components.length > 0 && (
                        <>
                            <ProjectManager
                                components={components}
                                onDeleteProject={deleteProject}
                                onFilterProject={(projectName) => setSelectedProject(projectName)}
                            />
                            
                            <DataTable
                                components={components}
                                headers={headers}
                                selectedProject={selectedProject}
                                setSelectedProject={setSelectedProject}
                                selectedTypes={selectedTypes}
                                setSelectedTypes={setSelectedTypes}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                findAlternatives={findAlternatives}
                                editComponent={editComponent}
                                deleteComponent={deleteComponent}
                                clearLibrary={clearLibrary}
                                saveLibraryToFile={saveLibraryToFile}
                                importLibrary={importLibrary}
                                kicadSchematics={kicadSchematics}
                                matchWithKiCad={matchWithKiCad}
                                generateKiCadComponent={generateKiCadComponent}
                                designatorConfig={config.designatorMeanings}
                                onCopyKiCadSymbol={copyKiCadSymbolToClipboard}
                            />
                        </>
                    )}

                    {components.length === 0 && !isProcessing && (
                        <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center ring-1 ring-keylife-accent/20">
                            <svg 
                                className="w-24 h-24 mx-auto text-gray-600 mb-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                No Components Yet
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Upload your first BOM file to get started with component management
                            </p>
                            
                            {/* Show Import Library option even when empty */}
                            <div className="mt-8">
                                <label className="cursor-pointer inline-block">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                importLibrary(file);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <span className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Import Existing Library
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="mt-12 text-center text-gray-500 text-sm border-t border-gray-800 pt-6">
                    <p>© 2025 KeyLife Electronics - R&D Internal Tool</p>
                    <p className="mt-1">Developed by Amro K. Saleh</p>
                </footer>
            </div>
            
            {/* Modals */}
            <AiModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalContent={modalContent}
                isLoadingAi={isLoadingAi}
            />

            <ConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                onSave={handleConfigSave}
                currentConfig={config}
            />

            <UnmatchedComponentsModal
                isOpen={isUnmatchedModalOpen}
                onClose={() => setIsUnmatchedModalOpen(false)}
                unmatchedComponents={unmatchedComponents}
                projectName={selectedProject || projectName}
                syncParams={syncParams}
            />
        </div>
    );
}