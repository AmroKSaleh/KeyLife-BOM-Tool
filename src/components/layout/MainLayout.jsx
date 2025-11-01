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
import TabNavigation from './TabNavigation.jsx';

export default function MainLayout({
    // Auth & Config props
    isAuthenticated,
    isAuthModalOpen, setIsAuthModalOpen,
    isConfigOpen, setIsConfigOpen,
    handleConfigSave, config,
    teamName,

    // UI State & Tabs [MODIFIED]
    tabsConfig = [], // <-- Receives config from App.jsx
    activeTab,
    setActiveTab,

    // AI Modal props
    isAiModalOpen, setIsAiModalOpen, modalContent, isLoadingAi,

    // Upload/Conflict Modals
    uploadStats, setUploadStats, setPendingComponents, handleResolveConflicts,
    confirmModal, setConfirmModal,
    
    // Ambiguous data
    ambiguousData, 
    projectName,

    // KiCad Modals
    isUnmatchedModalOpen, setIsUnmatchedModalOpen, unmatchedComponents, syncParams,
    
    // Main Content
    pageContent, // <-- Receives the active page component from App.jsx
    
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
    
    // Helper to close upload conflict modals cleanly
    const closeUploadModals = () => {
        setUploadStats(null);
        setPendingComponents(null);
    };

    return (
        <div className="text-gray-100 min-h-screen font-sans">
            <AppHeader
                isAuthenticated={isAuthenticated}
                onShowConfig={() => setIsConfigOpen(true)}
                onShowAuth={() => setIsAuthModalOpen(true)}
                teamName={teamName}
            />
            <main>           
                {isAuthenticated ? (
                    <div>
                        {/* --- RENDER THE REUSABLE COMPONENT --- */}
                        <TabNavigation
                            tabsConfig={tabsConfig}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                        
                        <div className="container mx-auto p-4 md:p-8 max-w-7xl"> 
                            {/* --- RENDER THE DYNAMIC PAGE CONTENT --- */}
                            {pageContent}
                        </div>
                    </div>
                ) : (
                    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                        <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center ring-1 ring-keylife-accent/20">
                            <span className="material-symbols-outlined w-24 h-24 mx-auto text-keylife-accent mb-4 text-8xl">lock_open</span>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                Authentication Required
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Please sign in to access the BOM Consolidation Tool
                            </p>
                        </div>
                    </div>
                )}
            </main>
            
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