import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * Token panel component that displays token information and DexScreener iframe
 */
export default function TokenPanel() {
  return (
    <section className="py-16 px-4 bg-primary-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center mb-10">
          <img 
            src="https://images.unsplash.com/photo-1632373564064-9af5f2854b38" 
            alt="$WANTAM Token Logo" 
            className="w-16 h-16 mr-4 rounded-full"
          />
          <h2 className="text-3xl font-bold text-white">$WANTAM Token</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Burnt LP Card */}
          <Card className="bg-primary-black/90 border border-white/10 hover:border-gold/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gold">Burnt LP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white text-lg">
                Liquidity tokens permanently burned for security
              </p>
            </CardContent>
          </Card>
          
          {/* Supply Card */}
          <Card className="bg-primary-black/90 border border-white/10 hover:border-gold/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gold">1B Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white text-lg">
                Fixed total supply of 1 billion tokens
              </p>
            </CardContent>
          </Card>
          
          {/* Tax Card */}
          <Card className="bg-primary-black/90 border border-white/10 hover:border-gold/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gold">0% Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white text-lg">
                No buy or sell tax on transactions
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* DexScreener iFrame Placeholder */}
        <div className="w-full h-96 bg-primary-black border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/70 text-xl mb-4">DexScreener Chart Loading...</p>
              <div className="w-12 h-12 border-t-2 border-gold rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
          {/* Actual iframe would go here */}
          {/* <iframe 
            title="DexScreener"
            src="https://dexscreener.com/solana/WANTAM-PLACEHOLDER"
            className="w-full h-full"
          /> */}
        </div>
      </div>
    </section>
  );
}
