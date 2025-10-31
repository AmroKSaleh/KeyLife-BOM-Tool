/**
 * @file AppFooter.jsx
 * @description Application footer component with copyright and links.
 */

export default function AppFooter() {
    return (
        <footer className="bg-gray-800/50 text-gray-500 text-sm mt-12 py-4 border-t border-gray-800/50">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl text-center">
                <p>&copy; {new Date().getFullYear()} <a href="https://keylife.tech"><span className="">KeyLife Electronics</span></a> - <a href="https://rnd.keylife.tech"><span className="text-keylife-accent">R&D</span></a> Internal Tool. All Rights Reserved.</p>
                <div className="mt-1 space-x-3 text-xs">
                    <a 
                        href="https://github.com/AmroKSaleh/KeyLife-BOM-Tool" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-keylife-accent transition-colors"
                    >
                        GitHub Repository
                    </a>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-600">{/** get version from .env file */}Version: {import.meta.env.VITE_APP_VERSION || '0.2.0 beta'}</span>
                </div>
            </div>
        </footer>
    );
}
