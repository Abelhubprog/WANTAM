/**
 * Production-ready MPESA Webhook API Route
 * Processes incoming MPESA payment notifications with proper error handling and logging
 */
import { NextRequest, NextResponse } from 'next/server';
import { processWebhook, MPESAWebhookPayload } from '@/lib/mpesa/webhook';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * POST handler for MPESA webhook
 * Receives payment notifications and processes them for pledge verification
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('MPESA webhook received', { requestId });
    
    // Verify webhook secret if provided
    const webhookSecret = process.env.MPESA_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authorization = request.headers.get('authorization');
      if (!authorization || !authorization.startsWith('Bearer ') || authorization.split(' ')[1] !== webhookSecret) {
        logger.warn('Invalid webhook secret', { requestId });
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('Invalid content type', { requestId, contentType });
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }
    
    // Parse the webhook payload
    let payload: MPESAWebhookPayload;
    try {
      payload = await request.json();
    } catch (error) {
      logger.error('Error parsing webhook payload', { requestId, error });
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    // Basic validation
    if (!payload || !payload.TransID || !payload.MSISDN) {
      logger.warn('Incomplete payload received', { requestId });
      return NextResponse.json(
        { error: 'Incomplete payload' },
        { status: 400 }
      );
    }
    
    // Process the webhook
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing Supabase credentials', { requestId });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
<<<<<<< HEAD
    const response = await processWebhook(payload);
=======
    const response = await processWebhook(
      payload,
      supabaseUrl,
      supabaseKey
    );
>>>>>>> origin/main
    
    logger.info('MPESA webhook processed successfully', { 
      requestId,
      transactionId: payload.TransID,
<<<<<<< HEAD
      success: response.success
=======
      resultCode: response.ResultCode
>>>>>>> origin/main
    });
    
    // Return the response
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('Error in MPESA webhook handler', { requestId, error });
    
    return NextResponse.json(
      {
        ResultCode: '1',
        ResultDesc: 'Server error',
      },
      { status: 500 }
    );
  }
}
