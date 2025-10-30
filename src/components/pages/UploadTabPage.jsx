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
    );
}