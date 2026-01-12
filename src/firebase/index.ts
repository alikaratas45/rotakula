
'use client';

// This file is intentionally modified to remove all Firebase dependencies.

export const initializeFirebase = () => {
  console.warn("Firebase is currently disabled.");
  return {
    firebaseApp: null,
    auth: null,
    firestore: null
  };
};

export function getSdks(firebaseApp: any) {
  return {
    firebaseApp,
    auth: null,
    firestore: null
  };
}

export * from './provider';
export * from './client-provider';

// Re-exporting dummy versions to prevent import errors in other files
export const useCollection = () => ({ data: [], isLoading: false, error: null });
export const useDoc = () => ({ data: null, isLoading: false, error: null });

export const addDocumentNonBlocking = async () => { 
  console.warn("Firebase is disabled. addDocumentNonBlocking did nothing.");
};

export class FirestorePermissionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FirestorePermissionError';
  }
}

export const errorEmitter = {
  on: () => {},
  off: () => {},
  emit: () => {},
};
