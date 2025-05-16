/**
 * Production-ready MPESA webhook handling
 */
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

/**
 * Process an incoming MPESA webhook notification
 * @param payload The webhook payload from MPESA
 * @returns Processing result with success status and details
 */
export async function processWebhook(payload: MPESAWebhookPayload) {
  try {
    logger.info('Processing MPESA webhook', { transactionId: payload.TransID });
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Store the transaction in database
    const { error } = await supabase
      .from('mpesa_transactions')
      .insert({
        transaction_id: payload.TransID,
        transaction_time: payload.TransTime,
        amount: payload.TransAmount,
        msisdn: payload.MSISDN,
        first_name: payload.FirstName || '',
        last_name: payload.LastName || '',
        raw_payload: payload
      });
      
    if (error) {
      logger.error('Error storing MPESA transaction', { error, transactionId: payload.TransID });
      return { success: false, error: 'Database error' };
    }
    
    // Additional business logic can be implemented here
    
    return { success: true, transactionId: payload.TransID };
  } catch (error) {
    logger.error('Error processing MPESA webhook', { error });
    return { success: false, error: 'Processing error' };
  }
}

// Define the expected webhook payload structure
export interface MPESAWebhookPayload {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber?: string;
  InvoiceNumber?: string;
  OrgAccountBalance: string;
  ThirdPartyTransID?: string;
  MSISDN: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

// Type for verification results
export interface VerificationResult {
  success: boolean;
  message: string;
  county?: string;
  amount?: number;
  transactionId?: string;
  phoneNumber?: string;
}

/**
 * Verify that a webhook payload is valid
 * @param payload MPESA webhook payload
 * @returns Verification result object
 */
export function verifyWebhookPayload(payload: MPESAWebhookPayload): VerificationResult {
  try {
    // Check for required fields
    const requiredFields = [
      'TransactionType', 'TransID', 'TransTime',
      'TransAmount', 'BusinessShortCode', 'MSISDN'
    ];
    
    for (const field of requiredFields) {
      if (!payload[field as keyof MPESAWebhookPayload]) {
        return {
          success: false,
          message: `Missing required field: ${field}`
        };
      }
    }
    
    // Verify transaction amount is 1.00 KES (for pledges)
    const amount = parseFloat(payload.TransAmount);
    if (amount !== 1.00) {
      return {
        success: false,
        message: `Invalid amount: ${amount}. Pledge amount must be exactly KES 1.00`
      };
    }
    
    // Verify the BusinessShortCode is correct
    // In production, this would check against your actual MPESA shortcode
    const expectedShortcode = process.env.NEXT_PUBLIC_MPESA_SHORTCODE || '123456';
    if (payload.BusinessShortCode !== expectedShortcode) {
      return {
        success: false,
        message: `Invalid business shortcode: ${payload.BusinessShortCode}`
      };
    }
    
    // Get county from BillRefNumber or InvoiceNumber
    const county = payload.BillRefNumber || payload.InvoiceNumber;
    if (!county) {
      return {
        success: false,
        message: 'Missing county information'
      };
    }
    
    // Success - return validated data
    return {
      success: true,
      message: 'Webhook payload verified',
      county,
      amount,
      transactionId: payload.TransID,
      phoneNumber: payload.MSISDN
    };
  } catch (error) {
    logger.error('Error verifying webhook payload', { error, payload });
    return {
      success: false,
      message: 'Error processing webhook payload'
    };
  }
}

/**
 * Process a verified MPESA webhook payload
 * @param payload Verified MPESA webhook payload
 * @returns Processing result
 */
export async function processWebhookPayload(
  supabase: any,
  payload: MPESAWebhookPayload
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    // Verify the payload
    const verification = verifyWebhookPayload(payload);
    if (!verification.success) {
      return {
        success: false,
        message: verification.message
      };
    }
    
    const { county, phoneNumber, transactionId } = verification;
    
    // Hash the phone number for privacy
    const phoneHash = await hashPhoneNumber(phoneNumber!);
    
    // Create pledge in database
    const { data, error } = await supabase
      .from('pledges')
      .insert({
        phone_hash: phoneHash,
        county: county,
        transaction_id: transactionId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      // If it's a duplicate transaction, we'll still return success
      if (error.code === '23505' && error.message.includes('transaction_id')) {
        return {
          success: true,
          message: 'Duplicate transaction, already processed'
        };
      }
      
      logger.error('Error creating pledge', { error, transactionId });
      return {
        success: false,
        message: `Failed to create pledge: ${error.message}`
      };
    }
    
    // Also update the verified_users table to mark this phone as verified
    const { error: userError } = await supabase
      .from('verified_users')
      .upsert([{
        phone: phoneHash,
        verified_at: new Date().toISOString(),
        county: county,
        transaction_id: payload.TransID,
      }]);
    
    if (userError) {
      logger.warn('Error updating verified users', { error: userError, phone: phoneNumber });
      // We'll still continue since the pledge was created successfully
    }
    
    return {
      success: true,
      message: 'Pledge created successfully',
      id: data.id
    };
  } catch (error) {
    logger.error('Error processing webhook payload', { error, payload });
    return {
      success: false,
      message: 'Internal server error'
    };
  }
}

/**
 * Hash a phone number using SHA-256 for privacy
 * @param phoneNumber Phone number to hash
 * @returns Hashed phone number
 */
async function hashPhoneNumber(phoneNumber: string): Promise<string> {
  try {
    // In a browser environment
    const encoder = new TextEncoder();
    const data = encoder.encode(phoneNumber);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    // Fallback for environments where crypto.subtle is not available
    logger.error('Error hashing phone number', { error });
    
    // Simple hash function fallback
    let hash = 0;
    for (let i = 0; i < phoneNumber.length; i++) {
      const char = phoneNumber.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return 'fallback_' + Math.abs(hash).toString(16);
  }
}
