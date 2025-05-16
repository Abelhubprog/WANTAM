/**
 * Production-ready BuyPanel component for embedding pump.fun with tip redirection
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { sendTip, confirmTip, TipError } from '../../lib/solana/sendTip';
import { logger } from '../../lib/utils/logger';
import supabase from '../../lib/supabase/client';

interface BuyPanelProps {
  className?: string;
  userId?: string;
  defaultTip?: number;
}

/**
 * Component that wraps pump.fun and adds a tip checkbox
 */
export default function BuyPanel({ 
  className = '', 
  userId,
  defaultTip = 5
}: BuyPanelProps) {
  // State
  const [tipEnabled, setTipEnabled] = useState(true);
  const [tipPercentage, setTipPercentage] = useState(defaultTip);
  const [txInProgress, setTxInProgress] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [phantom, setPhantom] = useState<any>(null);
  const [totalTips, setTotalTips] = useState<string | null>(null);
  
  // Connect to Phantom wallet
  useEffect(() => {
    const connectWallet = async () => {
      try {
        // Check if Phantom is installed
        if ('phantom' in window) {
          const provider = (window as any).phantom?.solana;
          
          if (provider?.isPhantom) {
            setPhantom(provider);
            
            // Check if user is already connected
            const { publicKey } = await provider.connect({ onlyIfTrusted: true });
            if (publicKey) {
              setWallet(publicKey);
              localStorage.setItem('walletConnected', 'true');
            }
          }
        }
      } catch (error) {
        // User not previously connected, that's okay
        logger.debug('Wallet not automatically connected', { error });
      }
    };
    
    // Auto-connect if user has previously connected
    if (localStorage.getItem('walletConnected') === 'true') {
      connectWallet();
    }
  }, []);
  
  // Listen for purchase success messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin (in production, check for pump.fun origin)
      // This would be the actual production domain in real code
      // if (event.origin !== 'https://pump.fun') return;
      
      if (event.data && event.data.type === 'purchaseSuccess') {
        const { txSignature, lamports } = event.data;
        logger.info('Purchase success received', { txSignature, lamports });
        
        if (txSignature && lamports && tipEnabled) {
          handlePurchaseSuccess(txSignature, lamports);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [tipEnabled, wallet, phantom]);
  
  // Fetch total tips on mount
  useEffect(() => {
    const fetchTotalTips = async () => {
      try {
        // This would be an API call in production
        // Simplified mock for now
        const response = await fetch('/api/tips/total');
        if (response.ok) {
          const data = await response.json();
          setTotalTips(data.total.toFixed(2));
        }
      } catch (error) {
        logger.error('Error fetching total tips', { error });
      }
    };
    
    fetchTotalTips();
  }, [txSuccess]);
  
  // Handler for purchase success
  const handlePurchaseSuccess = async (txSignature: string, lamports: number) => {
    if (!wallet || !phantom) {
      setTxError('Wallet not connected');
      return;
    }
    
    setTxInProgress(true);
    setPurchaseAmount(lamports);
    setTxError(null);
    
    try {
      // Create tip transaction
      const { transaction, tipAmount } = await sendTip(wallet, lamports, tipPercentage);
      
      // Have user sign the transaction
      const { signature } = await phantom.signAndSendTransaction(transaction);
      
      if (signature) {
        logger.info('Tip sent successfully!', { signature, tipAmount });
        
        // Confirm the transaction
        const confirmed = await confirmTip(signature, tipAmount, userId);
        
        if (confirmed) {
          // Record the tip in the database
          if (userId) {
            const { error } = await supabase.from('tips').insert([{
              user_id: userId,
              signature,
              amount: tipAmount,
              created_at: new Date().toISOString(),
            }]);
            
            if (error) {
              logger.error('Error recording tip', { error });
            }
          }
          
          setTxSuccess(true);
          
          // Reset success after 5 seconds
          setTimeout(() => {
            setTxSuccess(false);
          }, 5000);
        }
      }
    } catch (error) {
      logger.error('Error sending tip', { error });
      setTxError((error as TipError).message && error instanceof TipError
        ? (error as TipError).message 
        : 'Failed to send tip. Please try again.'
      );
    } finally {
      setTxInProgress(false);
    }
  };
  
  // Connect wallet handler
  const connectWalletHandler = useCallback(async () => {
    if (!phantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    
    try {
      const { publicKey } = await phantom.connect();
      setWallet(publicKey);
      localStorage.setItem('walletConnected', 'true');
    } catch (error) {
      logger.error('User cancelled connection', { error });
    }
  }, [phantom]);

  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 bg-primary-black/80 ${className}`}>
      <div className="p-4 bg-primary-black border-b border-white/10">
        <h2 className="text-xl font-bold text-white mb-2">Buy $WANTAM Token</h2>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="tipCheckbox"
            checked={tipEnabled}
            onChange={() => setTipEnabled(!tipEnabled)}
            className="w-4 h-4 mr-2 accent-kenyan-green"
            aria-label="Enable donation to Clean-Slate Fund"
          />
          <label htmlFor="tipCheckbox" className="text-white flex-1">
            Tip {tipPercentage}% to Clean-Slate Fund
            <span className="block text-xs text-white/60">
              Supports clean candidates and grassroots organizing
            </span>
          </label>
        </div>
        
        {tipEnabled && (
          <div className="mb-4">
            <label className="text-white text-sm mb-1 block">Tip Percentage:</label>
            <div className="flex items-center">
              <input
                type="range"
                min="1"
                max="10"
                value={tipPercentage}
                onChange={(e) => setTipPercentage(parseInt(e.target.value))}
                className="w-full mr-2"
                aria-label="Tip percentage"
              />
              <span className="text-white font-bold min-w-8 text-right">{tipPercentage}%</span>
            </div>
          </div>
        )}
        
        {totalTips !== null && (
          <div className="text-white/70 text-sm mb-4">
            Total donations: {totalTips} SOL raised for clean-slate candidates
          </div>
        )}
        
        {!wallet && (
          <button
            onClick={connectWalletHandler}
            className="w-full py-2 px-4 bg-kenyan-green hover:bg-kenyan-green/90 text-white rounded-lg mb-2"
            aria-label="Connect Phantom wallet"
          >
            Connect Wallet
          </button>
        )}
        
        {txInProgress && (
          <div className="flex items-center justify-center text-white p-2 mb-2 bg-kenyan-green/20 rounded-lg">
            <div className="w-4 h-4 border-2 border-t-2 border-kenyan-green rounded-full animate-spin mr-2"></div>
            <span>Processing {tipPercentage}% tip of {((purchaseAmount * tipPercentage / 100) / 1e9).toFixed(4)} SOL</span>
          </div>
        )}
        
        {txSuccess && (
          <div className="flex items-center justify-center text-white p-2 mb-2 bg-kenyan-green/20 rounded-lg">
            <svg className="w-4 h-4 mr-2 text-kenyan-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Thank you! Your tip is supporting clean-slate candidates</span>
          </div>
        )}
        
        {txError && (
          <div className="flex items-center justify-center text-white p-2 mb-2 bg-kenyan-red/20 rounded-lg">
            <svg className="w-4 h-4 mr-2 text-kenyan-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{txError}</span>
          </div>
        )}
      </div>
      
      <div className="h-[500px] relative">
        {/* Pump.fun iframe */}
        <iframe
          src="https://pump.fun/iframe/WANTAM"
          title="Buy $WANTAM on pump.fun"
          width="100%"
          height="100%"
          frameBorder="0"
          allow="clipboard-write"
          aria-label="pump.fun trading widget"
        ></iframe>
        
        {/* Overlay to prevent clicks when wallet not connected */}
        {!wallet && (
          <div className="absolute inset-0 bg-primary-black/80 flex items-center justify-center">
            <div className="text-center p-6 bg-primary-black border border-white/10 rounded-xl max-w-sm">
              <h3 className="text-xl text-white mb-2">Connect Wallet First</h3>
              <p className="text-white/70 mb-4">
                You need to connect your Phantom wallet before purchasing $WANTAM
              </p>
              <button
                onClick={connectWalletHandler}
                className="py-2 px-6 bg-kenyan-green hover:bg-kenyan-green/90 text-white rounded-lg"
              >
                Connect Phantom
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
