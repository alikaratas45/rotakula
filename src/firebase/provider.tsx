'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo } from 'react';

// This file has been modified to remove Firebase dependencies.

export const FirebaseContext = createContext<any>(undefined);

export const FirebaseProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const contextValue = useMemo(() => ({
      areServicesAvailable: false,
      firebaseApp: null,
      firestore: null,
      auth: null,
      user: null,
      isUserLoading: false,
      userError: null,
  }), []);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};


export const useFirebase = (): any => {
  return useContext(FirebaseContext);
};

export const useAuth = (): any => {
    return null;
};

export const useFirestore = (): any => {
    return null;
};

export const useFirebaseApp = (): any => {
    return null;
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  return memoized;
}

export const useUser = (): any => {
  return { user: null, isUserLoading: false, userError: null };
};
