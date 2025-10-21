import { useState } from 'react';
import { useBOMData } from './hooks/useBOMData.js';
import { useGeminiAI } from './hooks/useGeminiAI.js';
import AiModal from './components/AiModal.jsx';
import SetupSection from './components/SetupSection.jsx';
import DataTable from './components/DataTable.jsx';

export default function App() {
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
        exportLibrary
    } = useBOMData();
    
    const { 
        isModalOpen,
        setIsModalOpen,
        modalContent,
        isLoadingAi,
        findAlternatives 
    } = useGeminiAI();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    return (
        <div className="text-gray-100 min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                {/* Header with Logo */}
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <img 
                            src="/src/img/keylife-logo-white.png" 
                            alt="KeyLife Electronics Logo" 
                            className="h-16 md:h-20 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
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
                    <SetupSection 
                        projectName={projectName}
                        setProjectName={setProjectName}
                        fileName={fileName}
                        handleFileUpload={handleFileUpload}
                        isProcessing={isProcessing}
                    />
                    
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

                    {components.length > 0 && (
                        <DataTable
                            components={components}
                            headers={headers}
                            selectedProject={selectedProject}
                            setSelectedProject={setSelectedProject}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            findAlternatives={findAlternatives}
                            clearLibrary={clearLibrary}
                            exportLibrary={exportLibrary}
                        />
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
                        </div>
                    )}
                </main>

                <footer className="mt-12 text-center text-gray-500 text-sm border-t border-gray-800 pt-6">
                    <p>© 2025 KeyLife Electronics - R&D Internal Tool</p>
                    <p className="mt-1">Developed by Amro K Saleh</p>
                </footer>
            </div>
            
            <AiModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalContent={modalContent}
                isLoadingAi={isLoadingAi}
            />
        </div>
    );
}