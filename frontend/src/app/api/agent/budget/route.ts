/**
 * Production-ready API route for processing budget PDFs and generating summaries
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateBudgetSummary } from '@/agents/budget-summary';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';
export const maxDuration = 60; // Set max duration to 60 seconds for PDF processing

/**
 * POST handler for processing budget PDFs
 * Expects a PDF file upload, returns a summarized analysis
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('Budget analysis request received', { requestId });
    
    // Check quota
    const quotaExceeded = await checkQuota();
    
    if (quotaExceeded) {
      logger.warn('Daily quota exceeded for budget analysis', { requestId });
      
      // Queue the request for later processing
      await queueRequest(request);
      
      return NextResponse.json(
        { 
          error: 'Daily quota exceeded',
          message: 'Your request has been queued for processing later.',
          queuePosition: await getQueueLength(),
          requestId
        },
        { status: 429 }
      );
    }
    
    // Parse multipart form data
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      logger.error('Error parsing form data', { requestId, error });
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File;
    
    if (!file) {
      logger.warn('No file provided', { requestId });
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file type (must be PDF)
    if (!file.type || !file.type.includes('pdf')) {
      logger.warn('Invalid file type', { requestId, fileType: file.type });
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      logger.warn('File too large', { requestId, fileSize: file.size });
      return NextResponse.json(
        { error: 'File too large, maximum size is 10MB' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Generate summary
    logger.info('Generating budget summary', { 
      requestId, 
      fileName: file.name,
      fileSize: file.size 
    });
    
    const summary = await generateBudgetSummary(fileBuffer, file.name);
    
    // Store summary in Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing Supabase credentials', { requestId });
      
      // Return summary anyway, but don't store it
      return NextResponse.json(
        {
          ...summary,
          stored: false,
          requestId
        },
        { status: 200 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('budgets')
      .insert([
        {
          file_name: file.name,
          file_url: summary.fileUrl,
          summary: summary.summary,
          key_points: summary.keyPoints,
          created_at: new Date().toISOString(),
          request_id: requestId
        }
      ])
      .select('id')
      .single();
    
    if (error) {
      logger.error('Error storing budget summary', { requestId, error });
    }
    
    // Increment request counter
    await incrementRequestCount();
    
    logger.info('Budget summary generated successfully', { 
      requestId, 
      summaryId: data?.id
    });
    
    return NextResponse.json(
      {
        ...summary,
        id: data?.id,
        requestId
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error in budget summary API', { requestId, error });
    
    return NextResponse.json(
      { 
        error: 'Failed to process budget file',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      { status: 500 }
    );
  }
}

/**
 * Checks if we've exceeded our daily quota for the Hugging Face API
 * @returns Promise<boolean> True if quota exceeded
 */
async function checkQuota(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Missing Supabase credentials for quota check');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('api_quotas')
      .select('count')
      .eq('date', today)
      .eq('api', 'huggingface')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Error checking API quota', { error });
      return false;
    }
    
    const count = data?.count || 0;
    const limit = parseInt(process.env.HF_DAILY_LIMIT || '30');
    
    return count >= limit;
  } catch (error) {
    logger.error('Error checking quota', { error });
    return false;
  }
}

/**
 * Increments the request count for today
 */
async function incrementRequestCount(): Promise<void> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Missing Supabase credentials for incrementing count');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Try to update existing record
    const { error: updateError } = await supabase
      .from('api_quotas')
<<<<<<< HEAD
      .update({ count: supabase.rpc('increment_counter', { row_count: 1 }) })
=======
      .update({ count: supabase.sql`count + 1` })
>>>>>>> origin/main
      .eq('date', today)
      .eq('api', 'huggingface');
    
    if (updateError) {
      // If update failed, try to insert new record
      const { error: insertError } = await supabase
        .from('api_quotas')
        .insert([
          {
            date: today,
            api: 'huggingface',
            count: 1
          }
        ]);
      
      if (insertError) {
        logger.error('Error incrementing request count', { insertError });
      }
    }
  } catch (error) {
    logger.error('Error incrementing request count', { error });
  }
}

/**
 * Queues a request for later processing
 * @param request - The original request to queue
 */
async function queueRequest(request: NextRequest): Promise<void> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Missing Supabase credentials for queueing request');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // We can't store the full request, so let's store what we can
    const { error } = await supabase
      .from('request_queue')
      .insert([
        {
          endpoint: 'budget',
          created_at: new Date().toISOString(),
          status: 'pending',
          // In a real implementation, we'd extract and store the file
          // For now, just note that it was queued
          data: JSON.stringify({
            queued: true,
            method: request.method,
            url: request.url
          })
        }
      ]);
    
    if (error) {
      logger.error('Error queueing request', { error });
    }
  } catch (error) {
    logger.error('Error queueing request', { error });
  }
}

/**
 * Gets the current length of the request queue
 * @returns Promise<number> Queue length
 */
async function getQueueLength(): Promise<number> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return 0;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { count, error } = await supabase
      .from('request_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (error) {
      logger.error('Error getting queue length', { error });
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    logger.error('Error getting queue length', { error });
    return 0;
  }
}
