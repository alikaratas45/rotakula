'use client';

import React, { type ReactNode } from 'react';

// This provider is temporarily disabled to remove Firebase dependencies.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
