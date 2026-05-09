"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { PrivyProvider } from "@/providers/privy-provider";
import { PropsWithChildren } from "react";

import { autoDiscover, createClient } from "@solana/client";

const solanaEndpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

const client = createClient({
  endpoint: solanaEndpoint,
  walletConnectors: autoDiscover(),
});

export function Providers({ children }: PropsWithChildren) {
  return (
    <PrivyProvider>
      <SolanaProvider client={client}>
        {children}
      </SolanaProvider>
    </PrivyProvider>
  );
}
