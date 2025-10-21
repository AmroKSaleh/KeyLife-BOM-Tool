/**
 * @file ProjectManager.jsx
 * @description Panel for managing entire projects (view stats, delete projects)
 */

import { useMemo } from 'react';

export default function ProjectManager({ components, onDeleteProject, onFilterProject }) {
    const projectStats = useMemo(() => {
        const stats = {};
        
        components.forEach(comp => {
            const project = comp.ProjectName;
            if (!stats[project]) {
                stats[project] = {
                    name: project,
                    count: 0,
                    uploadDate: comp.id ? comp.id.split('-').pop() : Date.now()
                };
            }
            stats[project].count++;
        });
        
        return Object.values(stats).sort((a, b) => b.count - a.count);
    }, [components]);

    if (projectStats.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 ring-1 ring-keylife-accent/20">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-keylife-accent">
                    Project Management
                </h2>
                <span className="text-sm text-gray-400">
                    {projectStats.length} project{projectStats.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectStats.map((project) => (
                    <div 
                        key={project.name}
                        className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-keylife-accent/50 transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {project.count} component{project.count !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                <div className="w-10 h-10 bg-keylife-accent/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-keylife-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onFilterProject(project.name)}
                                className="flex-1 bg-keylife-accent hover:bg-keylife-accent/80 text-white font-medium py-1.5 px-3 rounded-lg text-sm transition duration-200 inline-flex items-center justify-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                            </button>
                            <button
                                onClick={() => onDeleteProject(project.name)}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-1.5 px-3 rounded-lg text-sm transition duration-200 inline-flex items-center justify-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}