/**
 * Production-ready functions for interacting with the $WANTAM token on Solana
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';

// Constants
const WANTAM_MINT_ADDRESS = process.env.NEXT_PUBLIC_WANTAM_MINT || 'TokenAddress';
const WANTAM_LP_BURN_TX = process.env.NEXT_PUBLIC_WANTAM_BURN_TX || '7xB3bpAPuCdXvWkzUFVXnj5xnJJisJ5jW2rEUj4TW1Qh';
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Cached values
let cachedSupply: number | null = null;
let lastRefreshTime = 0;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Gets the total supply of the token
 * @param force - Whether to bypass cache
 * @returns A promise that resolves to the total supply
 */
export async function getSupply(force = false): Promise<number> {
  // Return cached value if available and recent
  const now = Date.now();
  if (!force && cachedSupply && now - lastRefreshTime < REFRESH_INTERVAL) {
    return cachedSupply;
  }
  
  try {
    // Create Solana connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Use Solana API to get token supply
    const mintInfo = await connection.getTokenSupply(new PublicKey(WANTAM_MINT_ADDRESS));
    
    if (mintInfo?.value?.uiAmount) {
      // Update cache
      cachedSupply = mintInfo.value.uiAmount;
      lastRefreshTime = now;
      return cachedSupply;
    }
    
    // Fallback
    return 1_000_000_000;
  } catch (error) {
    logger.error('Error fetching token supply', { error });
    
    // Return cached value if available, otherwise default
    return cachedSupply || 1_000_000_000;
  }
}

/**
 * Gets the transaction hash of the burn LP transaction
 * @returns A promise that resolves to the transaction hash
 */
export async function getBurnTx(): Promise<string> {
  // This is a fixed value, just return it
  return WANTAM_LP_BURN_TX;
}

/**
 * Checks if a wallet holds $WANTAM tokens
 * @param walletAddress - The wallet address to check
 * @returns A promise that resolves to true if the wallet holds tokens
 */
export async function hasWantamTokens(walletAddress: string): Promise<boolean> {
  try {
    if (!walletAddress) {
      return false;
    }
    
    // Create Solana connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Fetch token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    // Check if any account holds WANTAM tokens
    return tokenAccounts.value.some(account => 
      account.account.data.parsed.info.mint === WANTAM_MINT_ADDRESS
    );
  } catch (error) {
    logger.error('Error checking token balance', { error, walletAddress });
    return false;
  }
}

/**
 * Gets the token balance for a wallet
 * @param walletAddress - The wallet address to check
 * @returns A promise that resolves to the token balance
 */
export async function getTokenBalance(walletAddress: string): Promise<number> {
  try {
    if (!walletAddress) {
      return 0;
    }
    
    // Create Solana connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Fetch token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    // Find the WANTAM token account
    const wantamAccount = tokenAccounts.value.find(account => 
      account.account.data.parsed.info.mint === WANTAM_MINT_ADDRESS
    );
    
    if (wantamAccount) {
      return wantamAccount.account.data.parsed.info.tokenAmount.uiAmount;
    }
    
    return 0;
  } catch (error) {
    logger.error('Error fetching token balance', { error, walletAddress });
    return 0;
  }
}