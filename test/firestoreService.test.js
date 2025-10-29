/**
 * @file firestoreService.test.js
 * @description Test suite for Firestore service functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    subscribeToComponents, subscribeToProjectComponents, addComponent, addComponentsBatch,
    updateComponent, deleteComponent, deleteProjectComponents, deleteAllComponents,
    getNextLPNSequence, saveUserSettings, loadUserSettings, checkMPNExists,
    findLPNForMPN // Ensure this is exported from the actual service file
} from '../src/services/firestoreService.js';

// --- Mock Firestore ---
vi.mock('firebase/firestore', async (importOriginal) => {
    const original = await importOriginal();
    const buildMockPath = (dbOrRef, segments) => {
        const prefix = (dbOrRef && typeof dbOrRef === 'object' && !dbOrRef._path) ? 'db' : dbOrRef?._path;
        return `${prefix}/${segments.join('/')}`;
    };
    return {
        ...original,
        collection: vi.fn((db, ...pathSegments) => ({ _path: buildMockPath(db, pathSegments) })),
        doc: vi.fn((dbOrCollectionRef, ...pathSegments) => ({
            id: pathSegments[pathSegments.length - 1] === 'preferences' ? 'preferences' : pathSegments.join('/') || 'mock-doc-id',
            _path: buildMockPath(dbOrCollectionRef, pathSegments)
        })),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        query: vi.fn((collectionRef, ...constraints) => ({ _collectionRef: collectionRef, _constraints: constraints })),
        where: vi.fn((field, op, value) => ({ _field: field, _op: op, _value: value })),
        onSnapshot: vi.fn(),
        increment: vi.fn((value) => ({ _incrementValue: value })),
        runTransaction: vi.fn(),
    };
});

// Import the db mock *after* mocking firebase/firestore
// *** CORRECTED PATH AGAIN: ../src/config/firebase.js ***
vi.mock('../src/config/firebase.js', () => ({
    db: { mock: 'db_instance' } // Provide a simple mock object for db
}));

// Helper to get mocked Firestore functions
const getMockedFirestore = async () => await import('firebase/firestore');

describe('firestoreService', () => {
    let firestoreMocks;
    beforeEach(async () => {
        vi.clearAllMocks();
        firestoreMocks = await getMockedFirestore();
        // Default successful mocks
        firestoreMocks.onSnapshot.mockImplementation((ref, successCb, errorCb) => {
             successCb({ empty: true, docs: [], forEach: vi.fn() });
             return vi.fn(); // Return unsubscribe function
        });
        firestoreMocks.getDocs.mockResolvedValue({ empty: true, docs: [], forEach: vi.fn() });
        firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
        firestoreMocks.setDoc.mockResolvedValue();
        firestoreMocks.updateDoc.mockResolvedValue();
        firestoreMocks.deleteDoc.mockResolvedValue();
        firestoreMocks.runTransaction.mockImplementation(async (db, updateFunction) => {
             const mockCounterDoc = {
                 exists: () => true,
                 data: () => ({ sequence: 0 })
             };
             const transaction = {
                 get: vi.fn().mockResolvedValue(mockCounterDoc),
                 set: vi.fn()
             };
             const nextSequence = await updateFunction(transaction);
             return nextSequence;
        });
    });

    // --- Component Operations ---
    describe('Component Operations', () => {
        const userId = 'user1';
        const compData = { id: 'comp1', name: 'Test' };

        it('addComponent should call setDoc with correct path and data', async () => {
            await addComponent(userId, compData);
            expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
                expect.objectContaining({ _path: `db/users/${userId}/components/comp1` }),
                expect.objectContaining({ name: 'Test', id: 'comp1', createdAt: expect.any(String) })
            );
        });

        it('addComponentsBatch should call addComponent for each component', async () => {
            const components = [{ id: 'c1' }, { id: 'c2' }];
            // Since addComponent is mocked via setDoc, check setDoc calls
            await addComponentsBatch(userId, components);
            expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(components.length);
        });


        it('updateComponent should call updateDoc with correct path and data', async () => {
            const updates = { name: 'Updated' };
            await updateComponent(userId, 'comp1', updates);
            expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
                expect.objectContaining({ _path: `db/users/${userId}/components/comp1` }),
                expect.objectContaining({ name: 'Updated', updatedAt: expect.any(String) })
            );
        });

        it('deleteComponent should call deleteDoc with correct path', async () => {
            await deleteComponent(userId, 'comp1');
            expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith(
                expect.objectContaining({ _path: `db/users/${userId}/components/comp1` })
            );
        });
    });

    // --- Project Operations ---
    describe('Project Operations', () => {
        const userId = 'user1';
        const projectName = 'ProjectA';

        it('deleteProjectComponents should query and call deleteDoc for each match', async () => {
            const mockDocs = [
                { id: 'c1', ref: 'ref1', data: () => ({ ProjectName: projectName }) },
                { id: 'c2', ref: 'ref2', data: () => ({ ProjectName: projectName }) }
            ];
            firestoreMocks.getDocs.mockResolvedValue({
                empty: false,
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            });

            await deleteProjectComponents(userId, projectName);

            expect(firestoreMocks.query).toHaveBeenCalledWith(
                expect.objectContaining({ _path: `db/users/${userId}/components` }),
                expect.objectContaining({ _field: 'ProjectName', _op: '==', _value: projectName })
            );
            expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(mockDocs.length);
            expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('ref1');
            expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('ref2');
        });

        it('deleteAllComponents should get all docs and call deleteDoc for each', async () => {
            const mockDocs = [{ id: 'c1', ref: 'ref1' }, { id: 'c2', ref: 'ref2' }];
            firestoreMocks.getDocs.mockResolvedValue({
                empty: false,
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            });

            await deleteAllComponents(userId);

            expect(firestoreMocks.getDocs).toHaveBeenCalledWith(
                expect.objectContaining({ _path: `db/users/${userId}/components` })
            );
            expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(mockDocs.length);
            expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('ref1');
            expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('ref2');
        });
    });

    // --- LPN Counter ---
    describe('LPN Counter', () => {
        it('getNextLPNSequence should run transaction and increment sequence', async () => {
            firestoreMocks.runTransaction.mockImplementation(async (db, updateFunction) => {
                const mockCounterDoc = {
                    exists: () => true,
                    data: () => ({ sequence: 5 })
                };
                const transaction = {
                    get: vi.fn().mockResolvedValue(mockCounterDoc),
                    set: vi.fn()
                };
                const nextSequence = await updateFunction(transaction);
                expect(transaction.get).toHaveBeenCalledWith(expect.objectContaining({ _path: 'db/system/lpn_counter' }));
                expect(transaction.set).toHaveBeenCalledWith(expect.objectContaining({ _path: 'db/system/lpn_counter' }), { sequence: 6 }, { merge: true });
                return nextSequence;
            });

            const result = await getNextLPNSequence();
            expect(result).toBe(6);
        });

        it('getNextLPNSequence should handle counter not existing', async () => {
            firestoreMocks.runTransaction.mockImplementation(async (db, updateFunction) => {
                const mockCounterDoc = { exists: () => false };
                const transaction = { get: vi.fn().mockResolvedValue(mockCounterDoc), set: vi.fn() };
                const nextSequence = await updateFunction(transaction);
                expect(transaction.set).toHaveBeenCalledWith(expect.anything(), { sequence: 1 }, { merge: true });
                return nextSequence;
            });
            const result = await getNextLPNSequence();
            expect(result).toBe(1);
        });

        it('getNextLPNSequence should throw error if limit reached', async () => {
             // FIX: The mock needs to actually throw the error from the updateFunction
             firestoreMocks.runTransaction.mockImplementation(async (db, updateFunction) => {
                const mockCounterDoc = { exists: () => true, data: () => ({ sequence: 99999 }) };
                const transaction = { get: vi.fn().mockResolvedValue(mockCounterDoc), set: vi.fn() };
                // Let updateFunction run and throw, runTransaction should propagate it
                return await updateFunction(transaction);
             });
             // Now test that calling getNextLPNSequence causes the rejection
             await expect(getNextLPNSequence()).rejects.toThrow('LPN sequence limit reached');
        });
    });

    // --- Settings Operations ---
    describe('Settings Operations', () => {
         const userId = 'user1';
         const settingsData = { theme: 'dark' };

         it('saveUserSettings should call setDoc with correct path and merge', async () => {
             await saveUserSettings(userId, settingsData);
             expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
                 expect.objectContaining({ _path: `db/users/${userId}/settings/preferences` }),
                 expect.objectContaining({ theme: 'dark', updatedAt: expect.any(String) }),
                 { merge: true }
             );
         });

         it('loadUserSettings should call getDoc and return data if exists', async () => {
             firestoreMocks.getDoc.mockResolvedValue({
                 exists: () => true,
                 data: () => settingsData
             });
             const result = await loadUserSettings(userId);
             expect(firestoreMocks.getDoc).toHaveBeenCalledWith(
                 expect.objectContaining({ _path: `db/users/${userId}/settings/preferences` })
             );
             expect(result).toEqual(settingsData);
         });

         it('loadUserSettings should return null if doc doesnt exist', async () => {
             firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
             const result = await loadUserSettings(userId);
             expect(result).toBeNull();
         });
    });

    // --- Check MPN & Find LPN ---
    describe('Check MPN & Find LPN', () => {
         const userId = 'user1';
         const mpn = 'MPN123';

         it('checkMPNExists should query and return true if docs found', async () => {
            firestoreMocks.getDocs.mockResolvedValue({ empty: false });
            const result = await checkMPNExists(userId, mpn);
            expect(firestoreMocks.query).toHaveBeenCalledWith(
                expect.objectContaining({ _path: `db/users/${userId}/components` }),
                expect.objectContaining({ _field: 'Mfr. Part #', _op: '==', _value: mpn })
            );
            expect(result).toBe(true);
         });

         it('checkMPNExists should return false if no docs found', async () => {
             firestoreMocks.getDocs.mockResolvedValue({ empty: true });
             const result = await checkMPNExists(userId, mpn);
             expect(result).toBe(false);
         });

         it('findLPNForMPN should query and return LPN if found', async () => {
            const mockLPN = 'KL-00001-ABCDEF';
            const mockDocs = [{ id: 'c1', data: () => ({ 'Mfr. Part #': mpn, 'Local_Part_Number': mockLPN }) }];
            firestoreMocks.getDocs.mockResolvedValue({
                empty: false,
                docs: mockDocs
            });

            const result = await findLPNForMPN(userId, mpn);

            expect(firestoreMocks.query).toHaveBeenCalledWith(
                expect.objectContaining({ _path: `db/users/${userId}/components` }),
                expect.objectContaining({ _field: 'Mfr. Part #', _op: '==', _value: mpn }),
                expect.objectContaining({ _field: 'Local_Part_Number', _op: '!=', _value: null })
            );
            expect(result).toBe(mockLPN);
         });

         it('findLPNForMPN should return null if no matching doc with LPN found', async () => {
             firestoreMocks.getDocs.mockResolvedValue({ empty: true });
             const result = await findLPNForMPN(userId, mpn);
             expect(result).toBeNull();
         });
    });

    // --- Real-time Subscriptions ---
    describe('Real-time Subscriptions', () => {
        const userId = 'user1';

        it('subscribeToComponents should call onSnapshot and invoke success callback on data', () => {
            const callback = vi.fn();
            const mockDocs = [{ id: 'c1', data: () => ({ name: 'Comp1' }) }];
            const mockSnapshot = {
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            };
            firestoreMocks.onSnapshot.mockImplementation((ref, successCb, errorCb) => {
                expect(ref._path).toBe(`db/users/${userId}/components`);
                successCb(mockSnapshot);
                return vi.fn();
            });

            subscribeToComponents(userId, callback);
            expect(callback).toHaveBeenCalledWith([{ id: 'c1', name: 'Comp1' }]);
        });

        it('subscribeToComponents should invoke error callback on error', () => {
            const callback = vi.fn();
            const mockError = new Error('Firestore read failed');
            firestoreMocks.onSnapshot.mockImplementation((ref, successCb, errorCb) => {
                errorCb(mockError);
                return vi.fn();
            });
            subscribeToComponents(userId, callback);
            expect(callback).toHaveBeenCalledWith(null, mockError);
        });

         it('subscribeToProjectComponents should call onSnapshot with query', () => {
            const callback = vi.fn();
            const projectName = 'ProjectB';
            firestoreMocks.onSnapshot.mockImplementation((queryRef, successCb, errorCb) => {
                 expect(queryRef._collectionRef._path).toBe(`db/users/${userId}/components`);
                 expect(queryRef._constraints).toEqual([
                     expect.objectContaining({ _field: 'ProjectName', _op: '==', _value: projectName })
                 ]);
                 successCb({ docs: [], forEach: vi.fn() });
                 return vi.fn();
            });
            subscribeToProjectComponents(userId, projectName, callback);
            expect(callback).toHaveBeenCalledWith([]);
         });
    });
});

