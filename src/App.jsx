import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useFirestore } from './hooks/useFirestore.js';
import { useLPN } from './hooks/useLPN.js';
import { useGeminiAI } from './hooks/useGeminiAI.js';
import { useKiCadParser } from './hooks/useKiCadParser.js';
import { useToastContext } from './context/ToastContext.jsx';
import { extractMPN } from './utils/lpnUtils.js';

import MainLayout from './components/layout/MainLayout.jsx';
import TabNavigation from './components/layout/TabNavigation.jsx';
import BomTabPage from './components/pages/BomTabPage.jsx';
import ProjectsTabPage from './components/pages/ProjectsTabPage.jsx';
import UploadTabPage from './components/pages/UploadTabPage.jsx';

export default function App() {
    const toast = useToastContext();
    
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [config, setConfig] = useState({
        designatorColumn: 'Designator',
        alternateDesignatorColumns: ['Reference', 'RefDes', 'Ref'],
        designatorMeanings: {
            'R': 'Resistor', 'C': 'Capacitor', 'L': 'Inductor', 'D': 'Diode',
            'Q': 'Transistor', 'U': 'Integrated Circuit', 'IC': 'Integrated Circuit',
            'J': 'Connector', 'P': 'Connector', 'SW': 'Switch', 'F': 'Fuse',
            'T': 'Transformer', 'X': 'Crystal/Oscillator', 'Y': 'Crystal',
            'BT': 'Battery', 'TP': 'Test Point', 'FID': 'Fiducial'
        },
        fieldMappings: {
            'Part Number': 'Mfr. Part #', 'MPN': 'Mfr. Part #', 'Part#': 'Mfr. Part #',
            'Reference': 'Designator', 'Ref': 'Designator', 'RefDes': 'Designator',
            'Qty': 'Quantity', 'Description': 'Description', 'Desc': 'Description',
            'Value': 'Value', 'Package': 'Footprint', 'Manufacturer': 'Manufacturer',
            'Mfr': 'Manufacturer'
        },
        kicadSyncParams: ['Datasheet', 'Mfr. Part #']
    });

    const {
        components, loading: firestoreLoading, addComponentsInBatch,
        updateExistingComponent, removeComponent, removeProject,
        clearAllComponents, saveSettings, loadSettings
    } = useFirestore();

    const teamName = user?.teamName || import.meta.env.VITE_APP_TEAMNAME || user?.email?.split('@')[1]?.split('.')[0] + "Team";

    const { assignLPN } = useLPN();

    const [projectName, setProjectName] = useState('');
    const [headers, setHeaders] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const [uploadStats, setUploadStats] = useState(null);
    const [pendingComponents, setPendingComponents] = useState(null);
    const [ambiguousData, setAmbiguousData] = useState(null);

    const { 
        isModalOpen: isAiModalOpen,
        setIsModalOpen: setIsAiModalOpen,
        modalContent,
        isLoadingAi,
        findAlternatives 
    } = useGeminiAI();

    const {
        kicadSchematics, isParsingKiCad, kicadError, setKicadError,
        syncParams, setSyncParams, unmatchedComponents, parseKiCadSchematic,
        matchWithKiCad, generateKiCadComponent, autoLinkWithBOM,
        copyKiCadSymbolToClipboard
    } = useKiCadParser();
    
    const [isUnmatchedModalOpen, setIsUnmatchedModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('upload');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedTypes, setSelectedTypes] = useState([]);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger'
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            setIsAuthModalOpen(true);
        } else if (isAuthenticated) {
            setIsAuthModalOpen(false);
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (isAuthenticated) {
            loadSettings().then(result => {
                if (result.success && result.settings) {
                    setConfig(prevConfig => ({ ...prevConfig, ...result.settings }));
                }
            });
        }
    }, [isAuthenticated, loadSettings]);

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

    const handleConfigSave = async (newConfig) => {
        setConfig(newConfig);
        setSyncParams(newConfig.kicadSyncParams);
        
        if (isAuthenticated) {
            const result = await saveSettings(newConfig);
            if (result.success) toast.success('Configuration saved');
            else toast.error('Failed to save configuration');
        }
    };

    const detectDuplicates = (newComponents) => {
        const duplicates = [];
        for (const newComp of newComponents) {
            const newMPN = extractMPN(newComp);
            if (!newMPN) continue;
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
    
    const handleBOMFileResolution = async (componentsToUpload) => {
        if (!componentsToUpload || componentsToUpload.length === 0) {
            toast.error('No components to submit.');
            return false;
        }
        
        const duplicates = detectDuplicates(componentsToUpload);

        if (duplicates.length > 0) {
            setPendingComponents(componentsToUpload);
            setUploadStats({
                totalParsed: componentsToUpload.length,
                newComponents: componentsToUpload.length - duplicates.length,
                duplicates: duplicates
            });
            return true;
        } else {
            return await processComponents(componentsToUpload);
        }
    };

    const handleBOMSubmit = async (componentsToUpload) => {
        return handleBOMFileResolution(componentsToUpload);
    };

    const handleAmbiguousResolution = async (resolvedComponents) => {
        const success = await handleBOMFileResolution(resolvedComponents);
        if (success) {
            setAmbiguousData(null);
        }
        return success;
    };

    const handleResolveConflicts = async (resolutions) => {
        if (!pendingComponents) return;
        const componentsToAdd = [];
        const componentsToUpdate = [];

        for (const comp of pendingComponents) {
            const mpn = extractMPN(comp);
            const resolution = resolutions[mpn];

            if (resolution === 'merge') {
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
                componentsToAdd.push(comp);
            }
        }
        for (const comp of componentsToUpdate) {
            await updateExistingComponent(comp.id, {
                Quantity: comp.Quantity,
                Qty: comp.Qty
            });
        }
        if (componentsToAdd.length > 0) {
            await processComponents(componentsToAdd);
        }
        setPendingComponents(null);
        setUploadStats(null);
        toast.success(`Processed ${componentsToUpdate.length + componentsToAdd.length} components`);
        return true;
    };

    const processComponents = async (componentsToAdd) => {
        setIsProcessing(true);
        try {
            const result = await addComponentsInBatch(componentsToAdd);
            if (!result.success) throw new Error(result.error || 'Failed to add components');
            
            let lpnSuccess = 0;
            let lpnFailed = 0;
            for (const comp of componentsToAdd) {
                const mpn = extractMPN(comp);
                if (mpn) {
                    const componentForLPN = { 
                        id: comp.id, 
                        'Mfr. Part #': mpn,
                    };
                    const lpnResult = await assignLPN(componentForLPN);
                    if (lpnResult.success) lpnSuccess++;
                    else lpnFailed++;
                }
            }
            toast.success(`Added ${componentsToAdd.length} components${lpnSuccess > 0 ? `, assigned ${lpnSuccess} LPNs` : ''}`);
            if (lpnFailed > 0) toast.warning(`${lpnFailed} components could not get LPNs`);
            return true;
        } catch (err) {
            toast.error(err.message || 'Failed to process components');
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKiCadUpload = async (file) => {
        if (!projectName.trim()) {
            setKicadError('Please enter a project name first');
            return;
        }
        await parseKiCadSchematic(file, projectName);
        if (components.length > 0) {
            const { matched, unmatched } = autoLinkWithBOM(components, projectName);
            if (unmatched.length > 0) {
                toast.warning(`${matched.length} matched, ${unmatched.length} unmatched`);
            } else {
                toast.success(`All ${matched.length} components matched`);
            }
        }
    };

    const handleEditComponent = async (componentId, updatedData) => {
        const result = await updateExistingComponent(componentId, updatedData);
        if (result.success) toast.success('Component updated');
        else toast.error(result.error || 'Failed to update component');
    };

    const handleDeleteComponent = (componentId) => {
        const component = components.find(c => c.id === componentId);
        if (!component) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Component',
            message: `Delete component "${component.Designator || component.Reference || 'Unknown'}"?`,
            onConfirm: async () => {
                const result = await removeComponent(componentId);
                if (result.success) toast.success('Component deleted');
                else toast.error(result.error || 'Failed to delete component');
            },
            type: 'danger'
        });
    };

    const handleDeleteProject = (projectName) => {
        const count = components.filter(c => c.ProjectName === projectName).length;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Project',
            message: `Delete all ${count} components from project "${projectName}"?`,
            onConfirm: async () => {
                const result = await removeProject(projectName);
                if (result.success) toast.success(`Project "${projectName}" deleted`);
                else toast.error(result.error || 'Failed to delete project');
            },
            type: 'danger'
        });
    };

    const handleClearLibrary = () => {
        if (components.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Clear Library',
            message: `Delete all ${components.length} components? This action cannot be undone.`,
            onConfirm: async () => {
                const result = await clearAllComponents();
                if (result.success) {
                    setProjectName('');
                    setHeaders([]);
                    toast.success('Library cleared');
                } else {
                    toast.error(result.error || 'Failed to clear library');
                }
            },
            type: 'danger'
        });
    };

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
            toast.success('Library exported');
        } catch (err) {
            toast.error('Failed to export library');
        }
    };

    const importLibrary = () => {
        toast.info('Import feature coming soon');
    };

    const handleFilterProject = (projectName) => {
        setSelectedProject(projectName);
        setActiveTab('bom');
    };

    return (
        <MainLayout
            isAuthenticated={isAuthenticated}
            isAuthModalOpen={isAuthModalOpen}
            setIsAuthModalOpen={setIsAuthModalOpen}
            isConfigOpen={isConfigOpen}
            setIsConfigOpen={setIsConfigOpen}
            handleConfigSave={handleConfigSave}
            config={config}
            teamName={teamName}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isAiModalOpen={isAiModalOpen}
            setIsAiModalOpen={setIsAiModalOpen}
            modalContent={modalContent}
            isLoadingAi={isLoadingAi}
            uploadStats={uploadStats}
            setUploadStats={setUploadStats}
            setPendingComponents={setPendingComponents}
            handleResolveConflicts={handleResolveConflicts}
            confirmModal={confirmModal}
            setConfirmModal={setConfirmModal}
            ambiguousData={ambiguousData}
            setAmbiguousData={setAmbiguousData}
            handleAmbiguousResolution={handleAmbiguousResolution}
            projectName={projectName}
            isUnmatchedModalOpen={isUnmatchedModalOpen}
            setIsUnmatchedModalOpen={setIsUnmatchedModalOpen}
            unmatchedComponents={unmatchedComponents}
            syncParams={syncParams}
            authLoading={authLoading}
        >
            {isAuthenticated && (
                <>
                    <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                    
                    <div className="mt-6">
                        {activeTab === 'upload' && (
                            <UploadTabPage
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
                        )}
                        
                        {activeTab === 'projects' && (
                            <ProjectsTabPage
                                components={components}
                                firestoreLoading={firestoreLoading}
                                onDeleteProject={handleDeleteProject}
                                onFilterProject={handleFilterProject}
                            />
                        )}

                        {activeTab === 'bom' && (
                            <BomTabPage
                                components={components}
                                headers={headers}
                                firestoreLoading={firestoreLoading}
                                isProcessing={isProcessing}
                                selectedProject={selectedProject}
                                setSelectedProject={setSelectedProject}
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
                                selectedTypes={selectedTypes}
                                setSelectedTypes={setSelectedTypes}
                                handleDeleteProject={handleDeleteProject}
                                handleClearLibrary={handleClearLibrary}
                            />
                        )}
                    </div>
                </>
            )}
        </MainLayout>
    );
}