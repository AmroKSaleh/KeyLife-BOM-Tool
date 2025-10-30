// src/pages/UploadTabPage.jsx
import React from 'react';
import SetupSection from '../SetupSection.jsx';
import 'material-symbols/outlined.css';

export default function UploadTabPage({ 
    projectName, setProjectName, 
    onBOMSubmit, onBOMFileResolve, 
    isProcessing, onKiCadUpload, 
    isParsingKiCad, kicadError, 
    kicadSchematics, config 
}) {
    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-12">
            <h2 className="text-xl font-semibold text-gray-300 mb-6">Upload BOM</h2>
            <SetupSection 
                projectName={projectName}
                setProjectName={setProjectName}
                onBOMSubmit={onBOMSubmit}
                onBOMFileResolve={onBOMFileResolve}
                isProcessing={isProcessing}
                onKiCadUpload={onKiCadUpload}
                isParsingKiCad={isParsingKiCad}
                kicadError={kicadError}
                kicadSchematics={kicadSchematics}
                config={config}
            />
        </div>
    );
}