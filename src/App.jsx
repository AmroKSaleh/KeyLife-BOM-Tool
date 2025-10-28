import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useFirestore } from './hooks/useFirestore.js';
import { useLPN } from './hooks/useLPN.js';
import { useGeminiAI } from './hooks/useGeminiAI.js';
import { useKiCadParser } from './hooks/useKiCadParser.js';
import { useToastContext } from './context/ToastContext.jsx';
import { extractMPN } from './utils/lpnUtils.js';
import AuthModal from './components/AuthModal.jsx';
import UserProfile from './components/UserProfile.jsx';
import AiModal from './components/AiModal.jsx';
import SetupSection from './components/SetupSection.jsx';
import DataTable from './components/DataTable.jsx';
import ProjectManager from './components/ProjectManager.jsx';
import ConfigModal from './components/ConfigModal.jsx';
import UnmatchedComponentsModal from './components/UnmatchedComponentsModal.jsx';
import UploadStatsModal from './components/UploadStatsModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import AmbiguousQtyModal from './components/AmbiguousQtyModal.jsx'; 

export default function App() {
    const toast = useToastContext();
    
    // Auth state
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

    // Firestore Hook
    const {
        components,
        loading: firestoreLoading,
        addComponentsInBatch,
        updateExistingComponent,
        removeComponent,
        removeProject,
        clearAllComponents,
        saveSettings,
        loadSettings,
        userId
    } = useFirestore();

    // LPN Hook
    const { assignLPN } = useLPN();

    // BOM Processing state
    const [projectName, setProjectName] = useState('');
    const [headers, setHeaders] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Upload Stats Modal
    const [uploadStats, setUploadStats] = useState(null);
    const [pendingComponents, setPendingComponents] = useState(null);

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

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'danger'
    });

    // Show auth modal if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            setIsAuthModalOpen(true);
        }
    }, [isAuthenticated, authLoading]);

    // Load config from settings
    useEffect(() => {
        if (isAuthenticated) {
            loadSettings().then(result => {
                if (result.success && result.settings) {
                    setConfig(result.settings);
                }
            });
        }
    }, [isAuthenticated, loadSettings]);

    // Update headers when components change
    useEffect(() => {
        if (components.length > 0) {
            const headersSet = new Set(['ProjectName']);
            components.forEach(comp => {
                Object.keys(comp).forEach(key => {
                    if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                        headersSet.add(key);
                    }
                });
            });
            const newHeaders = ['ProjectName', ...Array.from(headersSet).filter(h => h !== 'ProjectName')];
            setHeaders(newHeaders);
        } else {
            setHeaders([]);
        }
    }, [components]);

    // Handle configuration save
    const handleConfigSave = async (newConfig) => {
        setConfig(newConfig);
        setSyncParams(newConfig.kicadSyncParams);
        
        if (isAuthenticated) {
            const result = await saveSettings(newConfig);
            if (result.success) {
                toast.success('Configuration saved successfully');
            } else {
                toast.error('Failed to save configuration');
            }
        }
    };

    // Detect duplicates
    const detectDuplicates = (newComponents) => {
        const duplicates = [];
        
        for (const newComp of newComponents) {
            const newMPN = extractMPN(newComp);
            if (!newMPN) continue;

            // Check if MPN already exists in library
            const existingComp = components.find(c => {
                const existingMPN = extractMPN(c);
                return existingMPN && existingMPN === newMPN;
            });

            if (existingComp) {
                duplicates.push({
                    mpn: newMPN,
                    newComponent: newComp,
                    existingComponent: existingComp
                });
            }
        }

        return duplicates;
    };
    
    // CENTRAL HANDLER: Called by SetupSection after any resolution (AmbiguousQtyModal or Preview Submit)
    const handleBOMFileResolution = async (componentsToUpload) => {
        if (!componentsToUpload || componentsToUpload.length === 0) {
            toast.error('No components to submit after processing.');
            return false;
        }
        
        // Detect duplicates
        const duplicates = detectDuplicates(componentsToUpload);

        if (duplicates.length > 0) {
            // Show stats modal with conflicts
            setPendingComponents(componentsToUpload);
            setUploadStats({
                totalParsed: componentsToUpload.length,
                newComponents: componentsToUpload.length - duplicates.length,
                duplicates: duplicates
            });
            return true; // Return true to keep SetupSection workflow active (don't reset form)
        } else {
            // No conflicts, process immediately
            return await processComponents(componentsToUpload);
        }
    };

    // Handle BOM Submit (Used by SetupSection's preview submit button)
    const handleBOMSubmit = async (componentsToUpload) => {
        // This function is the entry point for submissions WITHOUT quantity ambiguity issues (i.e., straight from preview).
        return handleBOMFileResolution(componentsToUpload);
    };


    // Process components after conflict resolution (unchanged logic)
    const handleResolveConflicts = async (resolutions) => {
        if (!pendingComponents) return;

        const componentsToAdd = [];
        const componentsToUpdate = [];

        for (const comp of pendingComponents) {
            const mpn = extractMPN(comp);
            const resolution = resolutions[mpn];

            if (resolution === 'merge') {
                // Find existing and merge quantities
                const existing = components.find(c => extractMPN(c) === mpn);
                if (existing) {
                    const existingQty = parseInt(existing.Quantity || existing.Qty || 1);
                    const newQty = parseInt(comp.Quantity || comp.Qty || 1);
                    componentsToUpdate.push({
                        ...existing,
                        Quantity: existingQty + newQty,
                        Qty: existingQty + newQty
                    });
                }
            } else if (resolution === 'separate') {
                // Add as new component
                componentsToAdd.push(comp);
            }
            // 'skip' = do nothing
        }

        // Update merged components
        for (const comp of componentsToUpdate) {
            await updateExistingComponent(comp.id, {
                Quantity: comp.Quantity,
                Qty: comp.Qty
            });
        }

        // Add new components
        if (componentsToAdd.length > 0) {
            await processComponents(componentsToAdd);
        }

        // Clean up
        setPendingComponents(null);
        setUploadStats(null);
        
        toast.success(`Processed ${componentsToUpdate.length + componentsToAdd.length} components`);
        return true;
    };

    /**
     * Process and add components with auto-LPN
     */
    const processComponents = async (componentsToAdd) => {
        setIsProcessing(true);

        try {
            // Step 1: Add components to Firestore first
            const result = await addComponentsInBatch(componentsToAdd);

            if (!result.success) {
                throw new Error(result.error || 'Failed to add components');
            }

            // Step 2: AUTO-ASSIGN LPNs (Check and Assign/Reuse LPN)
            let lpnSuccess = 0;
            let lpnFailed = 0;

            for (const comp of componentsToAdd) {
                const mpn = extractMPN(comp);
                
                // Only attempt LPN assignment if MPN exists
                if (mpn) {
                    // Components in 'componentsToAdd' already have a temporary ID generated in bomParser.
                    // We use this ID to update the document we just created in Firestore.
                    const componentForLPN = { 
                        id: comp.id, 
                        'Mfr. Part #': mpn,
                        // This comp object may contain other MPN fields, but 'Mfr. Part #' is the canonical one set 
                        // before calling assignLPN for DB consistency check.
                    };

                    // Call assignLPN, which now handles the reuse check against the entire database
                    const lpnResult = await assignLPN(componentForLPN);

                    if (lpnResult.success) {
                        lpnSuccess++;
                    } else {
                        lpnFailed++;
                    }
                }
            }


            toast.success(`Added ${componentsToAdd.length} components${lpnSuccess > 0 ? `, assigned ${lpnSuccess} LPNs` : ''}`);
            
            if (lpnFailed > 0) {
                toast.warning(`${lpnFailed} components could not get LPNs automatically`);
            }

            return true;
        } catch (err) {
            toast.error(err.message || 'Failed to process components');
            return false;
        } finally {
            setIsProcessing(false);
        }
    };


    // Handle KiCad file upload
    const handleKiCadUpload = async (file) => {
        if (!projectName.trim()) {
            setKicadError('Please enter a project name first');
            return;
        }

        await parseKiCadSchematic(file, projectName);
        
        if (components.length > 0) {
            const { matched, unmatched } = autoLinkWithBOM(components, projectName);
            if (unmatched.length > 0) {
                toast.warning(`${matched.length} components matched, ${unmatched.length} unmatched`);
            } else {
                toast.success(`All ${matched.length} components matched with KiCad schematic`);
            }
        }
    };

    // Handle component edit
    const handleEditComponent = async (componentId, updatedData) => {
        const result = await updateExistingComponent(componentId, updatedData);
        if (result.success) {
            toast.success('Component updated successfully');
        } else {
            toast.error(result.error || 'Failed to update component');
        }
    };

    // Handle component delete
    const handleDeleteComponent = (componentId) => {
        const component = components.find(c => c.id === componentId);
        if (!component) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Component',
            message: `Are you sure you want to delete component "${component.Designator || component.Reference || 'Unknown'}"? This action cannot be undone.`,
            onConfirm: async () => {
                const result = await removeComponent(componentId);
                if (result.success) {
                    toast.success('Component deleted successfully');
                } else {
                    toast.error(result.error || 'Failed to delete component');
                }
            },
            type: 'danger'
        });
    };

    // Handle project delete
    const handleDeleteProject = (projectName) => {
        const count = components.filter(c => c.ProjectName === projectName).length;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Project',
            message: `Are you sure you want to delete all ${count} components from project "${projectName}"? This action cannot be undone.`,
            onConfirm: async () => {
                const result = await removeProject(projectName);
                if (result.success) {
                    toast.success(`Project "${projectName}" deleted (${count} components removed)`);
                } else {
                    toast.error(result.error || 'Failed to delete project');
                }
            },
            type: 'danger'
        });
    };

    // Handle clear library
    const handleClearLibrary = () => {
        if (components.length === 0) return;

        setConfirmModal({
            isOpen: true,
            title: 'Clear Library',
            message: `Are you sure you want to clear all ${components.length} components? This action cannot be undone.`,
            onConfirm: async () => {
                const result = await clearAllComponents();
                if (result.success) {
                    setProjectName('');
                    setHeaders([]);
                    toast.success('Library cleared successfully');
                } else {
                    toast.error(result.error || 'Failed to clear library');
                }
            },
            type: 'danger'
        });
    };

    // Export library
    const saveLibraryToFile = () => {
        if (components.length === 0) {
            toast.warning('No components to export');
            return;
        }

        try {
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                projectCount: new Set(components.map(c => c.ProjectName)).size,
                componentCount: components.length,
                headers,
                components
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `keylife_bom_library_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Library exported successfully');
        } catch (err) {
            toast.error('Failed to export library');
        }
    };

    // Import library (placeholder)
    const importLibrary = () => {
        toast.info('Import feature coming soon');
    };

    // Show loading spinner during auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <LoadingSpinner size="xl" message="Loading..." />
            </div>
        );
    }

    return (
        <div className="text-gray-100 min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                {/* Header */}
                <header className="text-center mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1"></div>
                        
                        <div className="flex-1 flex items-center justify-center gap-4">
                            <img 
                                src="/src/img/keylife-logo-white.png" 
                                alt="KeyLife Electronics Logo" 
                                className="h-16 md:h-20 object-contain"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>

                        <div className="flex-1 flex justify-end gap-3">
                            {isAuthenticated ? (
                                <>
                                    <UserProfile />
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
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="bg-keylife-accent hover:bg-keylife-accent/80 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-keylife-accent mb-2">
                        BOM Consolidation Tool
                    </h1>
                    <p className="text-lg text-gray-400">
                        Upload, Search, and Manage Component Libraries with AI
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                        v0.2.0 Beta • KeyLife Electronics R&D
                    </div>
                </header>

                <main>
                    {isAuthenticated ? (
                        <>
                            <SetupSection 
                                projectName={projectName}
                                setProjectName={setProjectName}
                                onBOMSubmit={handleBOMSubmit}
                                onBOMFileResolve={handleBOMFileResolution}
                                isProcessing={isProcessing}
                                onKiCadUpload={handleKiCadUpload}
                                isParsingKiCad={isParsingKiCad}
                                kicadError={kicadError}
                                kicadSchematics={kicadSchematics}
                                config={config}
                            />

                            {isProcessing && (
                                <div className="bg-blue-900/30 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                                    <LoadingSpinner size="sm" />
                                    <span>Processing components...</span>
                                </div>
                            )}

                            {firestoreLoading && components.length === 0 && (
                                <div className="flex justify-center py-12">
                                    <LoadingSpinner size="lg" message="Loading components..." />
                                </div>
                            )}

                            {components.length > 0 && (
                                <>
                                    <ProjectManager
                                        components={components}
                                        onDeleteProject={handleDeleteProject}
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
                                        editComponent={handleEditComponent}
                                        deleteComponent={handleDeleteComponent}
                                        clearLibrary={handleClearLibrary}
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

                            {components.length === 0 && !isProcessing && !firestoreLoading && (
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
                                        Upload your first BOM file to get started
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center ring-1 ring-keylife-accent/20">
                            <svg 
                                className="w-24 h-24 mx-auto text-keylife-accent mb-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                Authentication Required
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Please sign in to access the BOM Consolidation Tool
                            </p>
                        </div>
                    )}
                </main>

                <footer className="mt-12 text-center text-gray-500 text-sm border-t border-gray-800 pt-6">
                    <p>© 2025 KeyLife Electronics - R&D Internal Tool</p>
                    <p className="mt-1">Developed by Amro K. Saleh</p>
                </footer>
            </div>
            
            {/* Modals */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

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

            <UploadStatsModal
                isOpen={!!uploadStats}
                onClose={() => {
                    setUploadStats(null);
                    setPendingComponents(null);
                }}
                stats={uploadStats}
                onResolveConflicts={handleResolveConflicts}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />
        </div>
    );
}
