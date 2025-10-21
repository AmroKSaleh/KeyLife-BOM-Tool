/**
 * @file ComponentActions.jsx
 * @description Component action controls for editing and deleting individual components
 */

import { useState } from 'react';

export default function ComponentActions({ component, onEdit, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({ ...component });

    const handleSave = () => {
        onEdit(component.id, editedData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedData({ ...component });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this component?')) {
            onDelete(component.id);
        }
    };

    if (isEditing) {
        return (
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-500 text-white font-medium py-1 px-3 rounded-lg text-sm transition duration-200 inline-flex items-center gap-1"
                    title="Save changes"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                </button>
                <button
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-1 px-3 rounded-lg text-sm transition duration-200 inline-flex items-center gap-1"
                    title="Cancel editing"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-1 px-3 rounded-lg text-sm transition duration-200 inline-flex items-center gap-1"
                title="Edit component"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
            </button>
            <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-500 text-white font-medium py-1 px-3 rounded-lg text-sm transition duration-200 inline-flex items-center gap-1"
                title="Delete component"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
            </button>
        </div>
    );
}