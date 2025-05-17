/**
 * Production-ready API route for voting on meme entries
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';

/**
 * POST handler for voting on a meme entry
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('Meme vote request received', { requestId });
    
    // Check rate limit (IP-based)
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) {
      logger.warn('Rate limit exceeded for meme voting', {
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
    
    const { id, userId } = body;
    
    // Validate inputs
    if (!id) {
      logger.warn('Missing meme ID in vote request', { requestId });
      return NextResponse.json(
        { error: 'Meme ID is required' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      logger.warn('Missing user ID in vote request', { requestId });
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user is MPESA-verified if required
    const isVerified = await checkUserVerification(userId);
    if (!isVerified) {
      logger.warn('Unverified user attempting to vote', { requestId, userId });
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
    
    // Get current week number
    const currentWeek = getWeekNumber();
    
    // Check if user has already voted this week
    const { data: existingVote, error: checkError } = await supabase
      .from('meme_votes')
      .select('id')
      .eq('user', userId)
      .eq('week', currentWeek)
      .single();
    
    if (!checkError && existingVote) {
      logger.warn('User already voted this week', { 
        requestId, 
        userId, 
        week: currentWeek 
      });
      
      return NextResponse.json(
        { 
          error: 'Already voted',
          message: 'You have already voted for a meme this week' 
        },
        { status: 400 }
      );
    }
    
    // Check if meme exists and is from current week
    const { data: meme, error: memeError } = await supabase
      .from('meme_entries')
      .select('id, week, user')
      .eq('id', id)
      .single();
    
    if (memeError || !meme) {
      logger.warn('Meme not found', { requestId, memeId: id });
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      );
    }
    
    // Verify the meme is from the current week
    if (meme.week !== currentWeek) {
      logger.warn('Attempted vote for meme from different week', { 
        requestId, 
        memeId: id, 
        memeWeek: meme.week, 
        currentWeek 
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid meme',
          message: 'You can only vote for memes from the current week' 
        },
        { status: 400 }
      );
    }
    
    // Prevent voting for your own meme
    if (meme.user === userId) {
      logger.warn('User attempted to vote for their own meme', { 
        requestId, 
        userId, 
        memeId: id 
      });
      
      return NextResponse.json(
        { 
          error: 'Cannot vote for own meme',
          message: 'You cannot vote for your own meme' 
        },
        { status: 400 }
      );
    }
    
    // Begin transaction using RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('vote_for_meme', {
      p_meme_id: id,
      p_user_id: userId,
      p_week: currentWeek
    });
    
    if (rpcError) {
      logger.error('Error during vote transaction', { requestId, error: rpcError });
      
      // Fallback to manual transaction if RPC fails
      try {
        // Manually execute transaction
        
        // 1. Record the vote
        const { error: voteError } = await supabase
          .from('meme_votes')
          .insert([
            {
              user: userId,
              meme_id: id,
              week: currentWeek,
              created_at: new Date().toISOString(),
              request_id: requestId
            }
          ]);
        
        if (voteError) {
          throw voteError;
        }
        
        // 2. Increment the meme's vote count
        const { error: updateError } = await supabase
          .from('meme_entries')
<<<<<<< HEAD
          .update({ votes: supabase.rpc('increment_counter', { row_count: 1 }) })
=======
          .update({ votes: supabase.sql`votes + 1` })
>>>>>>> origin/main
          .eq('id', id);
        
        if (updateError) {
          throw updateError;
        }
      } catch (fallbackError) {
        logger.error('Fallback transaction also failed', { 
          requestId, 
          error: fallbackError 
        });
        
        return NextResponse.json(
          { error: 'Failed to record vote' },
          { status: 500 }
        );
      }
    }
    
    // Update rate limit counter
    await incrementRateLimitCounter(request);
    
    logger.info('Vote recorded successfully', { 
      requestId, 
      userId, 
      memeId: id, 
      week: currentWeek 
    });
    
    return NextResponse.json(
      {
        message: 'Vote recorded successfully',
        id,
        week: currentWeek,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error in meme vote', { requestId, error });
    
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
    
    // Check rate limit (20 votes per hour per IP)
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);
    
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact' })
      .eq('ip', ip)
      .eq('endpoint', 'meme_vote')
      .gte('created_at', hourAgo.toISOString());
    
    if (error) {
      logger.error('Error checking rate limit', { error, ip });
      return false;
    }
    
    const limit = parseInt(process.env.MEME_VOTE_RATE_LIMIT || '20');
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
          endpoint: 'meme_vote',
          created_at: new Date().toISOString()
        }
      ]);
  } catch (error) {
    logger.error('Error incrementing rate limit counter', { error });
  }
}
