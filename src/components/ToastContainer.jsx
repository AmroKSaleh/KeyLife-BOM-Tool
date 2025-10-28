/**
 * @file ToastContainer.jsx
 * @description Container component for rendering multiple toast notifications
 */

import ToastNotification from './ToastNotification.jsx';

export default function ToastContainer({ toasts, onClose }) {
    if (!toasts || toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map((toast, index) => (
                <ToastNotification
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    duration={toast.duration}
                    onClose={() => onClose(toast.id)}
                    position="top-right"
                />
            ))}
        </div>
    );
}