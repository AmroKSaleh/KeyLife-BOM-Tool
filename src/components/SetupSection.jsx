/**
 * @file SetupSection.jsx
 * @description Enhanced project setup and file upload interface with better UX
 */

export default function SetupSection({ projectName, setProjectName, fileName, handleFileUpload, isProcessing }) {
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
                        disabled={isProcessing}
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
                            ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-600 hover:border-keylife-accent'}
                        `}
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-keylife-accent mr-2"></div>
                                <span>Processing...</span>
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
                                    {fileName || 'Choose a file...'}
                                </span>
                            </>
                        )}
                    </label>
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileUpload}
                        disabled={isProcessing}
                        className="hidden"
                    />
                    {fileName && (
                        <p className="mt-1 text-xs text-keylife-accent">
                            ✓ File selected: {fileName}
                        </p>
                    )}
                </div>
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
                            <li>Ensure your BOM file has a header row</li>
                            <li>All uploaded components will be consolidated into one library</li>
                            <li>You can upload multiple files for different projects</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}