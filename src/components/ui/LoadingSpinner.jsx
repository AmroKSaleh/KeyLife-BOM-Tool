/**
 * @file LoadingSpinner.jsx
 * @description Loading spinner component with optional message
 */

export default function LoadingSpinner({ 
    size = 'md', // 'sm', 'md', 'lg', 'xl'
    message = '',
    fullScreen = false 
}) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
        xl: 'w-16 h-16 border-4'
    };

    const spinnerClass = sizeClasses[size] || sizeClasses.md;

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <div 
                className={`${spinnerClass} border-gray-700 border-t-keylife-accent rounded-full animate-spin`}
            />
            {message && (
                <p className="text-gray-400 text-sm">{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}