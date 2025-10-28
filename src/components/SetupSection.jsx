/**
 * @file SetupSection.jsx
 * @description Enhanced setup with preview and submit workflow
 */

import { useState } from 'react';
import { processBOMFile } from '../utils/bomParser.js';

export default function SetupSection({ 
    projectName, 
    setProjectName, 
    onBOMSubmit,
    isProcessing,
    onKiCadUpload,
    isParsingKiCad,
    kicadError,
    kicadSchematics,
    config
}) {
    const [bomFile, setBomFile] = useState(null);
    const [kicadFile, setKicadFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState('');

    // Handle BOM file selection and preview
    const handleBOMFileSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!projectName.trim()) {
            setParseError('Please enter a project name first');
            event.target.value = '';
            return;
        }

        setBomFile(file);
        setParseError('');
        setIsParsing(true);

        try {
            // Parse file for preview
            const { components, headers, count } = await processBOMFile(
                file,
                projectName.trim(),
                config
            );

            if (components.length === 0) {
                throw new Error('No components found in file');
            }

            // Show preview
            setPreviewData({
                fileName: file.name,
                count,
                headers,
                components: components.slice(0, 5), // Preview first 5
                totalComponents: components.length,
                allComponents: components
            });

        } catch (err) {
            setParseError(err.message || 'Failed to parse BOM file');
            setBomFile(null);
            setPreviewData(null);
        } finally {
            setIsParsing(false);
            event.target.value = '';
        }
    };

    // Handle KiCad file selection
    const handleKiCadFileUpload = async (event) => {
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

        setKicadFile(file);
        await onKiCadUpload(file);
        event.target.value = '';
    };

    // Submit BOM to database
    const handleSubmit = async () => {
        if (!previewData) return;
        
        const success = await onBOMSubmit(previewData.allComponents);
        
        if (success) {
            // Clear form
            setBomFile(null);
            setPreviewData(null);
            setParseError('');
        }
    };

    // Cancel and clear
    const handleCancel = () => {
        setBomFile(null);
        setPreviewData(null);
        setParseError('');
    };

    const hasSchematic = projectName && kicadSchematics[projectName];

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 ring-1 ring-keylife-accent/20">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Project Name Input */}
                <div>
                    <label 
                        htmlFor="projectName" 
                        className="block text-sm font-medium text-gray-300 mb-2"
                    >
                        Project Name
                        <span className="text-red-400 ml-1">*</span>
                    </label>
                    <input
                        type="text"
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g., Project Phoenix"
                        disabled={isProcessing || isParsing}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keylife-accent focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        maxLength={50}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Components will be tagged with this project name
                    </p>
                </div>
                
                {/* File Upload */}
                <div>
                    <label 
                        htmlFor="csv-upload" 
                        className="block text-sm font-medium text-gray-300 mb-2"
                    >
                        Upload BOM File
                        <span className="text-gray-500 text-xs ml-2">(.csv, .xlsx, .xls)</span>
                    </label>
                    <label 
                        htmlFor="csv-upload" 
                        className={`
                            w-full flex items-center justify-center 
                            bg-gray-700 border-2 border-dashed border-gray-600 
                            rounded-lg px-4 py-2.5 text-gray-300 
                            transition-all duration-200
                            ${isProcessing || isParsing || !projectName.trim() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-600 hover:border-keylife-accent'}
                        `}
                    >
                        {isParsing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-keylife-accent mr-2"></div>
                                <span>Parsing...</span>
                            </>
                        ) : (
                            <>
                                <svg 
                                    className="w-6 h-6 mr-2" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                                <span className="truncate">
                                    {bomFile?.name || 'Choose a file...'}
                                </span>
                            </>
                        )}
                    </label>
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleBOMFileSelect}
                        disabled={isProcessing || isParsing || !projectName.trim()}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Parse Error */}
            {parseError && (
                <div className="mt-4 bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg">
                    {parseError}
                </div>
            )}

            {/* Preview Section */}
            {previewData && (
                <div className="mt-6 bg-gray-900/50 rounded-lg border border-keylife-accent/30 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-keylife-accent">
                            📋 BOM Preview
                        </h3>
                        <span className="text-sm text-gray-400">
                            {previewData.totalComponents} components found
                        </span>
                    </div>

                    {/* Preview Table */}
                    <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    {previewData.headers.slice(0, 5).map(header => (
                                        <th key={header} className="text-left p-2 text-gray-400 font-medium">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.components.map((comp, idx) => (
                                    <tr key={idx} className="border-b border-gray-800">
                                        {previewData.headers.slice(0, 5).map(header => (
                                            <td key={header} className="p-2 text-gray-300">
                                                {comp[header] || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.totalComponents > 5 && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Showing first 5 of {previewData.totalComponents} components
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing}
                            className="flex-1 bg-keylife-accent hover:bg-keylife-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Submit & Add to Library
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isProcessing}
                            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            
            {/* KiCad Upload Section */}
            <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    KiCad Schematic Integration (Optional)
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label 
                            htmlFor="kicad-upload" 
                            className={`w-full flex items-center justify-center bg-gray-700 border-2 border-dashed border-purple-500/30 rounded-lg px-4 py-3 text-gray-300 transition-all duration-200 ${
                                isParsingKiCad || !projectName.trim() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-600 hover:border-purple-500'
                            }`}
                        >
                            {isParsingKiCad ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400 mr-2"></div>
                                    <span>Parsing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>{kicadFile?.name || 'Upload KiCad Schematic (.kicad_sch)'}</span>
                                </>
                            )}
                        </label>
                        <input
                            id="kicad-upload"
                            type="file"
                            accept=".kicad_sch"
                            onChange={handleKiCadFileUpload}
                            disabled={isParsingKiCad || !projectName.trim()}
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
            </div>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-start gap-2">
                    <svg 
                        className="w-5 h-5 text-keylife-accent flex-shrink-0 mt-0.5" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                    >
                        <path 
                            fillRule="evenodd" 
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                            clipRule="evenodd" 
                        />
                    </svg>
                    <div className="text-sm text-gray-400">
                        <p className="font-medium text-gray-300 mb-1">Quick Tips:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Enter project name → Select BOM file → Review preview → Submit</li>
                            <li>Files are parsed immediately to show statistics</li>
                            <li>You can upload multiple files for different projects</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}