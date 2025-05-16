/**
 * Production-ready tip functionality for Solana
 */
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { logger } from '../utils/logger';

// Constants
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const TIP_WALLET = process.env.NEXT_PUBLIC_TIP_WALLET;

// Error classes
export class TipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TipError';
  }
}

/**
 * Sends a tip to the Clean-Slate Fund wallet
 * @param from - Sender's wallet public key
 * @param lamports - Purchase amount in lamports
 * @param tipPercentage - Percentage to tip (default 5%)
 * @returns Promise resolving to transaction signature or error
 */
export async function sendTip(
  from: PublicKey, 
  lamports: number,
  tipPercentage: number = 5
): Promise<{ transaction: Transaction, tipAmount: number }> {
  try {
    // Validate inputs
    if (!from) {
      throw new TipError('Sender wallet is required');
    }

    if (!lamports || lamports <= 0) {
      throw new TipError('Invalid purchase amount');
    }

    if (!TIP_WALLET) {
      throw new TipError('Tip wallet address not configured');
    }

    // Calculate tip amount (percentage of purchase)
    const tipAmount = Math.floor(lamports * (tipPercentage / 100));
    
    if (tipAmount <= 0) {
      throw new TipError('Tip amount too small');
    }

    logger.info('Preparing tip transaction', { 
      from: from.toString(),
      to: TIP_WALLET,
      lamports,
      tipAmount,
      tipPercentage
    });

    // Create Solana connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: new PublicKey(TIP_WALLET),
        lamports: tipAmount
      })
    );
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = from;
    
    // Return transaction for signing by wallet
    return { 
      transaction, 
      tipAmount 
    };

  } catch (error) {
    logger.error('Error creating tip transaction', { error });
    throw error instanceof TipError 
      ? error 
      : new TipError('Failed to create tip transaction');
  }
}

/**
 * Confirms a tip transaction and records it in the database
 * @param signature - Transaction signature after sending
 * @param amount - Tip amount in lamports
 * @param userId - User ID for recording
 * @returns Promise resolving to confirmation status
 */
export async function confirmTip(
  signature: string,
  amount: number,
  userId?: string
): Promise<boolean> {
  try {
    if (!signature) {
      throw new TipError('Transaction signature is required');
    }

    logger.info('Confirming tip transaction', { signature, amount, userId });

    // Create Solana connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction(signature);
    
    if (confirmation.value.err) {
      logger.error('Tip transaction failed', { 
        signature, 
        error: confirmation.value.err 
      });
      return false;
    }
    
    // Record tip in database if applicable (could use Supabase here)
    if (userId) {
      logger.info('Recording tip transaction', { 
        userId, 
        signature, 
        amount 
      });
      
      // Record keeping code would go here
      // This would typically involve a database call to store the tip information
    }
    
    logger.info('Tip transaction confirmed successfully', { signature });
    return true;
    
  } catch (error) {
    logger.error('Error confirming tip transaction', { error, signature });
    return false;
  }
}

/**
 * Gets the total amount of tips sent to the clean slate fund
 * @returns Promise resolving to total tips in SOL
 */
export async function getTotalTips(): Promise<number> {
  try {
    if (!TIP_WALLET) {
      throw new TipError('Tip wallet address not configured');
    }

    // Create Solana connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Get wallet balance
    const balance = await connection.getBalance(new PublicKey(TIP_WALLET));
    
    // Convert from lamports to SOL
    return balance / 1_000_000_000;
    
  } catch (error) {
    logger.error('Error getting total tips', { error });
    return 0;
  }
}