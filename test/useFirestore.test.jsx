/**
 * @file useFirestore.test.jsx
 * @description Test suite for useFirestore hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFirestore } from '../src/hooks/useFirestore.js';
import * as firestoreService from '../src/services/firestoreService.js';
import { ToastProvider } from '../src/context/ToastContext.jsx';

// Mock Firebase auth - define callback storage at module level
let authStateCallback = null;

vi.mock('../src/config/firebase.js', () => ({
    auth: {
        get currentUser() { 
            return { uid: 'test-user-123', email: 'test@example.com' };
        }
    },
    getCurrentUserId: vi.fn(() => 'test-user-123'),
    db: {}
}));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((auth, callback) => {
        authStateCallback = callback;
        // Simulate immediate callback with user
        queueMicrotask(() => callback({ 
            uid: 'test-user-123', 
            email: 'test@example.com' 
        }));
        return vi.fn(); // unsubscribe
    })
}));

// Mock Firestore service
vi.mock('../src/services/firestoreService.js', () => ({
    subscribeToComponents: vi.fn(),
    addComponent: vi.fn(),
    addComponentsBatch: vi.fn(),
    updateComponent: vi.fn(),
    deleteComponent: vi.fn(),
    deleteProjectComponents: vi.fn(),
    deleteAllComponents: vi.fn(),
    getNextLPNSequence: vi.fn(),
    saveUserSettings: vi.fn(),
    loadUserSettings: vi.fn(),
    checkMPNExists: vi.fn()
}));

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

describe('useFirestore Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default mock implementation for subscribeToComponents
        vi.mocked(firestoreService.subscribeToComponents).mockImplementation((userId, callback) => {
            callback([]);
            return vi.fn(); // unsubscribe
        });
    });

    describe('Initialization', () => {
        it('should initialize with empty components and loading true', () => {
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            expect(result.current.loading).toBe(true);
            expect(result.current.components).toEqual([]);
            expect(result.current.error).toBe('');
        });

        it('should set userId when authenticated', async () => {
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => {
                expect(result.current.userId).toBe('test-user-123');
            });
        });

        it('should subscribe to components when userId is available', async () => {
            renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => {
                expect(firestoreService.subscribeToComponents).toHaveBeenCalledWith(
                    'test-user-123',
                    expect.any(Function)
                );
            });
        });
    });

    describe('addNewComponent', () => {
        it('should add a single component successfully', async () => {
            vi.mocked(firestoreService.addComponent).mockResolvedValueOnce();
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            const componentData = { id: 'c1', Designator: 'R1', Value: '100k' };
            let response;
            
            await act(async () => {
                response = await result.current.addNewComponent(componentData);
            });
            
            expect(response.success).toBe(true);
            expect(firestoreService.addComponent).toHaveBeenCalledWith('test-user-123', componentData);
        });

        it('should handle errors from addComponent', async () => {
            vi.mocked(firestoreService.addComponent).mockRejectedValueOnce(
                new Error('Network error')
            );
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.addNewComponent({ id: 'c1' });
            });
            
            expect(response.success).toBe(false);
            expect(response.error).toContain('Network error');
        });
    });

    describe('addComponentsInBatch', () => {
        it('should add multiple components successfully', async () => {
            vi.mocked(firestoreService.addComponentsBatch).mockResolvedValueOnce();
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            const components = [
                { id: 'c1', Designator: 'R1' },
                { id: 'c2', Designator: 'R2' }
            ];
            
            let response;
            await act(async () => {
                response = await result.current.addComponentsInBatch(components);
            });
            
            expect(response.success).toBe(true);
            expect(response.count).toBe(2);
            expect(firestoreService.addComponentsBatch).toHaveBeenCalledWith(
                'test-user-123',
                components
            );
        });

        it('should handle batch add errors', async () => {
            vi.mocked(firestoreService.addComponentsBatch).mockRejectedValueOnce(
                new Error('Batch failed')
            );
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.addComponentsInBatch([]);
            });
            
            expect(response.success).toBe(false);
            expect(response.error).toContain('Batch failed');
        });
    });

    describe('updateExistingComponent', () => {
        it('should update a component successfully', async () => {
            vi.mocked(firestoreService.updateComponent).mockResolvedValueOnce();
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            const updates = { Value: '200k' };
            let response;
            
            await act(async () => {
                response = await result.current.updateExistingComponent('c1', updates);
            });
            
            expect(response.success).toBe(true);
            expect(firestoreService.updateComponent).toHaveBeenCalledWith(
                'test-user-123',
                'c1',
                updates
            );
        });
    });

    describe('removeComponent', () => {
        it('should delete a component successfully', async () => {
            vi.mocked(firestoreService.deleteComponent).mockResolvedValueOnce();
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.removeComponent('c1');
            });
            
            expect(response.success).toBe(true);
            expect(firestoreService.deleteComponent).toHaveBeenCalledWith('test-user-123', 'c1');
        });
    });

    describe('removeProject', () => {
        it('should delete all project components successfully', async () => {
            vi.mocked(firestoreService.deleteProjectComponents).mockResolvedValueOnce();
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.removeProject('Project1');
            });
            
            expect(response.success).toBe(true);
            expect(firestoreService.deleteProjectComponents).toHaveBeenCalledWith(
                'test-user-123',
                'Project1'
            );
        });
    });

    describe('clearAllComponents', () => {
        it('should clear all components successfully', async () => {
            vi.mocked(firestoreService.deleteAllComponents).mockResolvedValueOnce();
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.clearAllComponents();
            });
            
            expect(response.success).toBe(true);
            expect(firestoreService.deleteAllComponents).toHaveBeenCalledWith('test-user-123');
        });
    });

    describe('getNextSequence', () => {
        it('should get next LPN sequence successfully', async () => {
            vi.mocked(firestoreService.getNextLPNSequence).mockResolvedValueOnce(123);
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.getNextSequence();
            });
            
            expect(response.success).toBe(true);
            expect(response.sequence).toBe(123);
        });
    });

    describe('Settings Operations', () => {
        it('should save user settings successfully', async () => {
            vi.mocked(firestoreService.saveUserSettings).mockResolvedValueOnce();
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            const settings = { theme: 'dark' };
            let response;
            
            await act(async () => {
                response = await result.current.saveSettings(settings);
            });
            
            expect(response.success).toBe(true);
            expect(firestoreService.saveUserSettings).toHaveBeenCalledWith(
                'test-user-123',
                settings
            );
        });

        it('should load user settings successfully', async () => {
            const mockSettings = { theme: 'dark' };
            vi.mocked(firestoreService.loadUserSettings).mockResolvedValueOnce(mockSettings);
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.loadSettings();
            });
            
            expect(response.success).toBe(true);
            expect(response.settings).toEqual(mockSettings);
        });
    });

    describe('doesMPNExist', () => {
        it('should check if MPN exists successfully', async () => {
            vi.mocked(firestoreService.checkMPNExists).mockResolvedValueOnce(true);
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            let response;
            await act(async () => {
                response = await result.current.doesMPNExist('MPN123');
            });
            
            expect(response.success).toBe(true);
            expect(response.exists).toBe(true);
        });
    });

    describe('Real-time Updates', () => {
        it('should update components when subscription callback is called', async () => {
            const mockComponents = [
                { id: 'c1', Designator: 'R1' },
                { id: 'c2', Designator: 'R2' }
            ];
            
            let subscriptionCallback;
            vi.mocked(firestoreService.subscribeToComponents).mockImplementation(
                (userId, callback) => {
                    subscriptionCallback = callback;
                    return vi.fn();
                }
            );
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            // Trigger subscription callback
            act(() => {
                subscriptionCallback(mockComponents);
            });
            
            await waitFor(() => {
                expect(result.current.components).toEqual(mockComponents);
                expect(result.current.loading).toBe(false);
            });
        });

        it('should handle subscription errors', async () => {
            let subscriptionCallback;
            vi.mocked(firestoreService.subscribeToComponents).mockImplementation(
                (userId, callback) => {
                    subscriptionCallback = callback;
                    return vi.fn();
                }
            );
            
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            // Trigger subscription error
            act(() => {
                subscriptionCallback(null, new Error('Subscription failed'));
            });
            
            await waitFor(() => {
                expect(result.current.error).toContain('Failed to load components');
                expect(result.current.loading).toBe(false);
            });
        });
    });

    describe('clearError', () => {
        it('should clear error state', async () => {
            const { result } = renderHook(() => useFirestore(), { wrapper });
            
            await waitFor(() => expect(result.current.userId).toBe('test-user-123'));
            
            // Set an error
            vi.mocked(firestoreService.addComponent).mockRejectedValueOnce(
                new Error('Test error')
            );
            
            await act(async () => {
                await result.current.addNewComponent({ id: 'c1' });
            });
            
            expect(result.current.error).toBeTruthy();
            
            // Clear error
            act(() => {
                result.current.clearError();
            });
            
            expect(result.current.error).toBe('');
        });
    });
});