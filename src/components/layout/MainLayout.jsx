import React from 'react';
import AppHeader from './AppHeader.jsx';
import AppFooter from './AppFooter.jsx';
import AuthModal from '../modals/AuthModal.jsx';
import AiModal from '../modals/AiModal.jsx';
import ConfigModal from '../modals/ConfigModal.jsx';
import UnmatchedComponentsModal from '../modals/UnmatchedComponentsModal.jsx';
import UploadStatsModal from '../modals/UploadStatsModal.jsx';
import ConfirmModal from '../modals/ConfirmModal.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

export default function MainLayout({
    // Auth & Config props
    isAuthenticated,
    isAuthModalOpen, setIsAuthModalOpen,
    isConfigOpen, setIsConfigOpen,
    handleConfigSave, config,

    // UI State & Tabs [NEW]
    activeTab,
    setActiveTab,

    // AI Modal props
    isAiModalOpen, setIsAiModalOpen, modalContent, isLoadingAi,

    // Upload/Conflict Modals
    uploadStats, setUploadStats, setPendingComponents, handleResolveConflicts,
    confirmModal, setConfirmModal,
    
    // Ambiguous data is passed down but modal rendering is delegated to SetupSection
    ambiguousData, 
    projectName,

    // KiCad Modals
    isUnmatchedModalOpen, setIsUnmatchedModalOpen, unmatchedComponents, syncParams,
    
    // Main Content
    pageContent,
    
    // Loading State
    authLoading
}) {

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <LoadingSpinner size="xl" message="Loading..." />
            </div>
        );
    }
   
    // Set theme colors for the MD tabs (matching KeyLife theme)
    const tabStyles = {
        '--md-sys-color-primary': '#49a4ad',
        '--md-sys-color-on-surface': 'white',
        '--md-sys-color-surface': '#1f2937',
        '--md-sys-color-on-surface-variant': 'rgba(255, 255, 255, 0.7)',
        '--md-tab-container-color': '#1f2937', // Explicitly set background
        '--md-tab-active-indicator-color': '#49a4ad' // Ensure indicator is visible
    };
    
    // Helper to close upload conflict modals cleanly
    const closeUploadModals = () => {
        setUploadStats(null);
        setPendingComponents(null);
    };

    /**
     * Handle tab change event from md-tabs component
     */
    const handleTabChange = (event) => {
        setActiveTab(event.target.activeTab.id);
    };

    return (
        <div className="text-gray-100 min-h-screen font-sans">
            <AppHeader
                isAuthenticated={isAuthenticated}
                onShowConfig={() => setIsConfigOpen(true)}
                onShowAuth={() => setIsAuthModalOpen(true)}
            />

            <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                <main>           
                    {isAuthenticated ? (
                        <>
                            {/* --- TABBED NAVIGATION (Material Web Tabs) --- */}
                            {/* --- TABBED NAVIGATION (Material Web Tabs) --- */}
                            <md-tabs 
                                active-tab={activeTab}
                                onchange={handleTabChange}
                                key={activeTab} // Use React key
                                className="mb-8"
                                style={{ ...tabStyles, minHeight: '48px' }} 
                            >
                                <md-primary-tab 
                                    key="upload" 
                                    id="upload" 
                                    label="Upload BOM" 
                                    icon="upload_file"
                                >Upload BOM</md-primary-tab>
                                <md-primary-tab 
                                    key="bom" 
                                    id="bom" 
                                    label="BOM Library" 
                                    icon="inventory_2"
                                >BOM Library</md-primary-tab>
                                <md-primary-tab 
                                    key="projects" 
                                    id="projects" 
                                    label="Projects Manager" 
                                    icon="folder_managed"
                                >Projects Manager</md-primary-tab>
                            </md-tabs>
                            {/* --- TAB CONTENT (children passed from App.jsx's renderTabContent) --- */}
                            {pageContent}
                        </>
                    ) : (
                        <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center ring-1 ring-keylife-accent/20">
                            <span className="material-symbols-outlined w-24 h-24 mx-auto text-keylife-accent mb-4 text-8xl">lock_open</span>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                Authentication Required
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Please sign in to access the BOM Consolidation Tool
                            </p>
                        </div>
                    )}
                </main>

            </div>
            
            <AppFooter />
            
            {/* Modals */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

            <AiModal
                isModalOpen={isAiModalOpen}
                setIsModalOpen={setIsAiModalOpen}
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
                projectName={projectName}
                syncParams={syncParams}
            />
            
            {/* Upload/Duplicate Conflict Modal */}
            <UploadStatsModal
                isOpen={!!uploadStats}
                onClose={closeUploadModals}
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