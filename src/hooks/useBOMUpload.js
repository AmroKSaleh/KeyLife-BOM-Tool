/**
 * @file useBOMUpload.js
 * @description React hook for handling BOM file uploads and processing
 */

import { useState, useCallback } from 'react';
import { useFirestore } from './useFirestore.js';
import { processBOMFile } from '../utils/bomParser.js';

export const useBOMUpload = (config) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const { addComponentsInBatch } = useFirestore();

    /**
     * Handle BOM file upload and processing
     */
    const handleFileUpload = useCallback(async (file, projectName) => {
        if (!file) {
            setError('No file selected');
            return { success: false, error: 'No file selected' };
        }

        if (!projectName || !projectName.trim()) {
            setError('Please enter a project name before uploading');
            return { success: false, error: 'Project name is required' };
        }

        setIsProcessing(true);
        setError('');
        setFileName(file.name);
        setUploadProgress(0);

        try {
            // Step 1: Parse BOM file (30%)
            setUploadProgress(10);
            const { components, headers, count } = await processBOMFile(
                file,
                projectName.trim(),
                config
            );

            if (components.length === 0) {
                throw new Error('No components found in file');
            }

            setUploadProgress(30);

            // Step 2: Upload to Firestore (70%)
            setUploadProgress(40);
            const result = await addComponentsInBatch(components);

            if (!result.success) {
                throw new Error(result.error || 'Failed to upload components');
            }

            setUploadProgress(100);
            setIsProcessing(false);

            return {
                success: true,
                count,
                headers,
                components
            };

        } catch (err) {
            const errorMsg = err.message || 'Failed to process file';
            setError(errorMsg);
            setIsProcessing(false);
            setUploadProgress(0);

            return {
                success: false,
                error: errorMsg
            };
        }
    }, [config, addComponentsInBatch]);

    /**
     * Clear error message
     */
    const clearError = useCallback(() => {
        setError('');
    }, []);

    /**
     * Reset upload state
     */
    const resetUpload = useCallback(() => {
        setFileName('');
        setError('');
        setUploadProgress(0);
    }, []);

    return {
        isProcessing,
        error,
        fileName,
        uploadProgress,
        handleFileUpload,
        clearError,
        resetUpload
    };
};