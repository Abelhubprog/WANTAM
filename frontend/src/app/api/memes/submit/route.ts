/**
 * Production-ready API route for submitting meme entries
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';

/**
 * POST handler for submitting a meme to the weekly contest
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('Meme submission request received', { requestId });
    
    // Check rate limit (IP-based)
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) {
      logger.warn('Rate limit exceeded for meme submission', {
        requestId,
        ip: request.ip || 'unknown'
      });
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Please try again later'
        },
        { status: 429 }
      );
    }
    
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.error('Error parsing request body', { requestId, error });
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    const { url, userId } = body;
    
    // Validate inputs
    if (!url) {
      logger.warn('Missing URL in meme submission', { requestId });
      return NextResponse.json(
        { error: 'Meme URL is required' },
        { status: 400 }
      );
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      logger.warn('Invalid URL format in meme submission', { requestId, url });
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      logger.warn('Missing user ID in meme submission', { requestId });
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user is MPESA-verified if required
    const isVerified = await checkUserVerification(userId);
    if (!isVerified) {
      logger.warn('Unverified user attempting meme submission', { requestId, userId });
      return NextResponse.json(
        { 
          error: 'User not verified',
          message: 'Please verify your account with MPESA first'
        },
        { status: 403 }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing Supabase credentials', { requestId });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if user has already submitted in this week
    const currentWeek = getWeekNumber();
    
    const { data: existingSubmission, error: checkError } = await supabase
      .from('meme_entries')
      .select('id')
      .eq('user', userId)
      .eq('week', currentWeek)
      .single();
    
    if (!checkError && existingSubmission) {
      logger.warn('User already submitted a meme this week', { 
        requestId, 
        userId, 
        week: currentWeek 
      });
      
      return NextResponse.json(
        { 
          error: 'Already submitted',
          message: 'You have already submitted a meme this week'
        },
        { status: 400 }
      );
    }
    
    // Insert the meme entry
    const { data, error } = await supabase
      .from('meme_entries')
      .insert([
        {
          url,
          user: userId,
          week: currentWeek,
          votes: 0,
          created_at: new Date().toISOString(),
          request_id: requestId
        }
      ])
      .select('id')
      .single();
    
    if (error) {
      logger.error('Error submitting meme', { requestId, error });
      return NextResponse.json(
        { error: 'Failed to submit meme' },
        { status: 500 }
      );
    }
    
    logger.info('Meme submitted successfully', { 
      requestId, 
      memeId: data.id, 
      userId, 
      week: currentWeek 
    });
    
    // Update rate limit counter
    await incrementRateLimitCounter(request);
    
    return NextResponse.json(
      {
        id: data.id,
        message: 'Meme submitted successfully',
        week: currentWeek,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error in meme submission', { requestId, error });
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * Gets the current week number of the year
 * @returns Week number (1-52)
 */
function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const weekNumber = Math.ceil(day / 7);
  
  return weekNumber;
}

/**
 * Checks if a user is verified (made MPESA payment)
 * @param userId - The user ID to check
 * @returns Promise resolving to boolean indicating if the user is verified
 */
async function checkUserVerification(userId: string): Promise<boolean> {
  // If MPESA verification is not enabled, return true
  if (process.env.REQUIRE_MPESA_VERIFICATION !== 'true') {
    return true;
  }
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing Supabase credentials for verification check');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('verified_users')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error checking user verification', { error, userId });
    return false;
  }
}

/**
 * Checks if a request exceeds rate limits
 * @param request - The incoming request
 * @returns Promise resolving to boolean indicating if rate limit is exceeded
 */
async function checkRateLimit(request: NextRequest): Promise<boolean> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get client IP
    const ip = request.ip || 'unknown';
    
    // Check rate limit (5 submissions per hour per IP)
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);
    
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact' })
      .eq('ip', ip)
      .eq('endpoint', 'meme_submit')
      .gte('created_at', hourAgo.toISOString());
    
    if (error) {
      logger.error('Error checking rate limit', { error, ip });
      return false;
    }
    
    const limit = parseInt(process.env.MEME_SUBMIT_RATE_LIMIT || '5');
    return (count || 0) >= limit;
  } catch (error) {
    logger.error('Error checking rate limit', { error });
    return false;
  }
}

/**
 * Increments the rate limit counter for a request
 * @param request - The incoming request
 */
async function incrementRateLimitCounter(request: NextRequest): Promise<void> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get client IP
    const ip = request.ip || 'unknown';
    
    // Insert rate limit record
    await supabase
      .from('rate_limits')
      .insert([
        {
          ip,
          endpoint: 'meme_submit',
          created_at: new Date().toISOString()
        }
      ]);
  } catch (error) {
    logger.error('Error incrementing rate limit counter', { error });
  }
}
