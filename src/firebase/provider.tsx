'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo } from 'react';

// This file has been modified to remove Firebase dependencies.

const emptyContext = {
    areServicesAvailable: false,
    firebaseApp: null,
    firestore: null,
    auth: null,
    user: null,
    isUserLoading: false,
    userError: null,
};

export const FirebaseContext = createContext<any>(emptyContext);

export const FirebaseProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const contextValue = useMemo(() => (emptyContext), []);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};


export const useFirebase = (): any => {
  return useContext(FirebaseContext) || emptyContext;
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
  // @ts-ignore
  memoized.__memo = true;
  return memoized;
}

export const useUser = (): any => {
  return { user: null, isUserLoading: false, userError: null };
};
