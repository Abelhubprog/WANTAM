/**
 * Production-ready API route for fetching pledge data for the county heat map
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCountyCounts } from '@/lib/supabase/pledges';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';

// Cache the response for 10 seconds for better performance
export const revalidate = 10;

/**
 * GET handler for fetching county pledge data
 * Returns a map of counties and their pledge counts
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('Fetching county pledge data', { requestId });
    
    // Check for force refresh parameter
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    // Get county data with optional cache refresh
    const countyData = await getCountyCounts(forceRefresh);
    
    // Generate cache control headers
    const cacheControl = process.env.NODE_ENV === 'production'
      ? 'public, s-maxage=10, stale-while-revalidate=59'
      : 'no-cache';
    
    logger.info('County pledge data fetched successfully', { 
      requestId, 
      countyCount: Object.keys(countyData).length
    });
    
    return NextResponse.json(countyData, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    logger.error('Error fetching county pledge data', { requestId, error });
    
    return NextResponse.json(
      { error: 'Failed to fetch county data' },
      { status: 500 }
    );
  }
}
