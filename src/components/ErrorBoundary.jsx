import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-8 max-w-2xl">
                        <h1 className="text-2xl font-bold text-red-300 mb-4">Something went wrong</h1>
                        <p className="text-gray-300 mb-4">{this.state.error?.message}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-keylife-accent px-4 py-2 rounded-lg"
                        >
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;