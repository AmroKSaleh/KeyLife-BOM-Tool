// src/components/layout/MainLayout.jsx
import React from 'react';
import AppHeader from './AppHeader.jsx';
import AppFooter from './AppFooter.jsx';
import AuthModal from '../modals/AuthModal.jsx';
import AiModal from '../modals/AiModal.jsx';
import ConfigModal from '../modals/ConfigModal.jsx';
import UnmatchedComponentsModal from '../modals/UnmatchedComponentsModal.jsx';
import UploadStatsModal from '../modals/UploadStatsModal.jsx';
import ConfirmModal from '../modals/ConfirmModal.jsx';
import AmbiguousQtyModal from '../modals/AmbiguousQtyModal.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

export default function MainLayout({
    // Auth & Config props
    isAuthenticated,
    isAuthModalOpen, setIsAuthModalOpen,
    isConfigOpen, setIsConfigOpen,
    handleConfigSave, config,

    // AI Modal props
    isAiModalOpen, setIsAiModalOpen, modalContent, isLoadingAi,

    // Upload/Conflict Modals
    uploadStats, setUploadStats, setPendingComponents, handleResolveConflicts,
    confirmModal, setConfirmModal,
    ambiguousData, setAmbiguousData, handleAmbiguousResolution, projectName,

    // KiCad Modals
    isUnmatchedModalOpen, setIsUnmatchedModalOpen, unmatchedComponents, syncParams,
    
    // Main Content
    children,
    
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
        setAmbiguousData(null);
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
                    <h1 className="text-4xl md:text-5xl font-bold text-keylife-accent mb-6 text-center">
                        BOM Consolidation Tool
                    </h1>
                    <div className="mt-2 text-sm text-gray-500 text-center mb-8">
                        v0.2.0 Beta • KeyLife Electronics R&D
                    </div>
                    
                    {isAuthenticated ? (
                        children
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

                <AppFooter />
            </div>
            
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

            {/* Ambiguous Quantity Modal (Part of upload workflow) */}
             <AmbiguousQtyModal
                isOpen={!!ambiguousData}
                onClose={closeUploadModals}
                ambiguousComponents={ambiguousData?.ambiguous || []}
                projectName={projectName}
                onResolve={handleAmbiguousResolution} 
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