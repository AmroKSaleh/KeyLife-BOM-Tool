/**
 * @file KiCadUploadSection.jsx
 * @description Component for uploading and managing KiCad schematic files
 */

export default function KiCadUploadSection({ 
    projectName, 
    onKiCadUpload, 
    isProcessing,
    kicadSchematics,
    kicadError 
}) {
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!projectName.trim()) {
            alert('Please enter a project name first');
            event.target.value = '';
            return;
        }

        if (!file.name.endsWith('.kicad_sch')) {
            alert('Please upload a valid KiCad schematic file (.kicad_sch)');
            event.target.value = '';
            return;
        }

        await onKiCadUpload(file, projectName);
        event.target.value = '';
    };

    const hasSchematic = projectName && kicadSchematics[projectName];

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 ring-1 ring-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-purple-400">
                        KiCad Schematic Integration
                    </h3>
                    <p className="text-sm text-gray-400">
                        Upload schematic to link BOM components
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label 
                        htmlFor="kicad-upload" 
                        className={`
                            w-full flex items-center justify-center 
                            bg-gray-700 border-2 border-dashed border-purple-500/30
                            rounded-lg px-4 py-3 text-gray-300 
                            transition-all duration-200
                            ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-600 hover:border-purple-500'}
                        `}
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400 mr-2"></div>
                                <span>Parsing...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span>Upload KiCad Schematic (.kicad_sch)</span>
                            </>
                        )}
                    </label>
                    <input
                        id="kicad-upload"
                        type="file"
                        accept=".kicad_sch"
                        onChange={handleFileUpload}
                        disabled={isProcessing}
                        className="hidden"
                    />
                </div>

                {hasSchematic && (
                    <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm">
                                <p className="text-purple-300 font-medium">
                                    {kicadSchematics[projectName].fileName}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    {kicadSchematics[projectName].components} components parsed
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {kicadError && (
                <div className={`mt-4 p-3 rounded-lg ${
                    kicadError.startsWith('✓') 
                        ? 'bg-green-900/30 border border-green-700/50 text-green-300'
                        : 'bg-red-900/30 border border-red-700/50 text-red-300'
                }`}>
                    {kicadError}
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                <p>💡 <strong>Tip:</strong> Upload your KiCad schematic to enable the "Copy for KiCad" button next to each component in the table.</p>
            </div>
        </div>
    );
}