// src/pages/ProjectsTabPage.jsx
import React from 'react';
import ProjectManager from '../ProjectManager.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

export default function ProjectsTabPage({ components, firestoreLoading, onDeleteProject, onFilterProject }) {
    if (firestoreLoading && components.length === 0) {
         return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" message="Loading project data..." />
            </div>
        );
    }

    if (components.length === 0) {
        return (
             <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center ring-1 ring-keylife-accent/20">
                <span className="material-symbols-outlined w-24 h-24 mx-auto text-gray-600 mb-4 text-8xl">folder_managed</span>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No Projects to Manage
                </h3>
                <p className="text-gray-400 mb-6">
                    Projects appear here after you upload a BOM.
                </p>
            </div>
        );
    }

    return (
        <ProjectManager
            components={components}
            onDeleteProject={onDeleteProject}
            onFilterProject={onFilterProject}
        />
    );
}