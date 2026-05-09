"use client";

import { PropsWithChildren } from 'react';

// API-READY: Replace with actual PrivyProvider from @privy-io/react-auth
// import { PrivyProvider } from '@privy-io/react-auth';

interface PrivyProviderProps extends PropsWithChildren {
  // API-READY: Add Privy config props here
  appId?: string;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  // API-READY: Wrap children with actual PrivyProvider
  // return <PrivyProvider appId={appId}>{children}</PrivyProvider>;

  // Mock implementation
  return <>{children}</>;
}