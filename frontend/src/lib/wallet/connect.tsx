import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Make sure default styles for wallet-adapter-react-ui work
require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletCtx {
  /* expose whatever helpers you need later */
}
const WalletContext = createContext<WalletCtx | null>(null);
export const useWalletContext = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('WalletContext unavailable');
  return ctx;
};

type Props = { children: ReactNode };

export const WalletCtxProvider = ({ children }: Props) => {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NET as WalletAdapterNetwork) || 'devnet';
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const contextValue = useMemo<WalletCtx>(() => ({}), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContext.Provider value={contextValue}>
            {children}
          </WalletContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
