// src/pages/BomTabPage.jsx
import React from 'react';
import DataTable from '../DataTable.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

export default function BomTabPage({
    components, headers, firestoreLoading, isProcessing,
    // DataTable Props
    selectedProject, setSelectedProject, searchTerm, setSearchTerm, findAlternatives,
    editComponent, deleteComponent, clearLibrary, saveLibraryToFile, importLibrary,
    kicadSchematics, matchWithKiCad, generateKiCadComponent, designatorConfig, onCopyKiCadSymbol,
    selectedTypes, setSelectedTypes, handleDeleteProject, handleClearLibrary
}) {

    if (firestoreLoading && components.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" message="Loading components..." />
            </div>
        );
    }
    
    if (components.length === 0) {
        return (
             <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center ring-1 ring-keylife-accent/20">
                <span className="material-symbols-outlined w-24 h-24 mx-auto text-gray-600 mb-4 text-8xl">inventory_2</span>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No Components Yet
                </h3>
                <p className="text-gray-400 mb-6">
                    Use the 'Upload BOM' tab to get started.
                </p>
            </div>
        );
    }

    return (
        <>
             {isProcessing && (
                <div className="bg-blue-900/30 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                    <LoadingSpinner size="sm" />
                    <span>Processing components...</span>
                </div>
            )}
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
                clearLibrary={handleClearLibrary}
                saveLibraryToFile={saveLibraryToFile}
                importLibrary={importLibrary}
                kicadSchematics={kicadSchematics}
                matchWithKiCad={matchWithKiCad}
                generateKiCadComponent={generateKiCadComponent}
                designatorConfig={designatorConfig}
                onCopyKiCadSymbol={onCopyKiCadSymbol}
            />
        </>
    );
}