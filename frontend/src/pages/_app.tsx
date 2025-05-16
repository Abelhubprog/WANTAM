import React from 'react';
import { AppProps } from 'next/app';
import { WalletCtxProvider } from '@/lib/wallet/connect';

function App({ Component, pageProps }: AppProps) {
  return (
    <WalletCtxProvider>
      <Component {...pageProps} />
    </WalletCtxProvider>
  );
}

export default App;
