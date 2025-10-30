import React from 'react';

export default function TabNavigation({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'upload', label: 'Upload BOM', icon: 'upload_file' },
        { id: 'projects', label: 'Manage Projects', icon: 'folder_managed' },
        { id: 'bom', label: 'BOM Library', icon: 'inventory_2' },
    ];

    const baseStyle = "flex-1 text-center px-4 py-3 font-medium border-b-2 transition-colors duration-200 flex items-center justify-center gap-2";
    const activeStyle = "border-keylife-accent text-keylife-accent";
    const inactiveStyle = "border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-200";

    return (
        <nav className="mb-8 flex bg-gray-800 rounded-lg overflow-hidden ring-1 ring-gray-700">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${baseStyle} ${activeTab === tab.id ? activeStyle : inactiveStyle}`}
                    aria-current={activeTab === tab.id}
                >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}