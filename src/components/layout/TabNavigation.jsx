import React from 'react';

// Theme styles now reference the global CSS variables
const tabStyles = {
    '--md-sys-color-primary': 'var(--keylife-accent-color)',
    '--md-sys-color-on-surface': 'white',
    '--md-sys-color-surface': 'var(--keylife-primary-color)', // This is a layout color, fine to keep
    '--md-sys-color-on-surface-variant': 'rgba(255, 255, 255, 0.7)',
    '--md-tab-container-color': 'var(--keylife-primary-color)', // Fine to keep
    '--md-tab-active-indicator-color': 'var(--keylife-accent-color)'
};

export default function TabNavigation({ tabsConfig = [], activeTab, setActiveTab }) {
    
    /**
     * Handle tab change event from md-tabs component
     */
    const handleTabChange = (event) => {
        setActiveTab(event.target.activeTab.id);
    };

    return (
        <md-tabs 
            active-tab={activeTab}
            onchange={handleTabChange}
            className=""
            style={{ ...tabStyles }} 
        >
            {tabsConfig.map(tab => (
                <md-primary-tab
                    key={tab.id}
                    id={tab.id}
                    aria-label={tab.label}
                >
                    {/* Ensure material-symbols font is imported in main.jsx or index.html */}
                    <md-icon slot="icon">{tab.icon}</md-icon>
                    {tab.label}
                </md-primary-tab>
            ))}
        </md-tabs>
    );
}