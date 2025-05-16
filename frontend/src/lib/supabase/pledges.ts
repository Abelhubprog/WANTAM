/**
 * Production-ready functions for interacting with pledges in the Supabase database
 */
import supabase, { handleSupabaseError } from '../supabase/client';
import { logger } from '../utils/logger';

/**
 * Fetch pledge counts by county for the heatmap visualization
 * @returns Array of counties with pledge counts
 */
export async function getCountyCounts(forceRefresh?: boolean): Promise<County[]> {
  try {
    const { data, error } = await supabase
      .from('counties')
      .select('name, code, pledge_count')
      .order('name');
      
    if (error) {
      handleSupabaseError('Error fetching county pledge counts', error);
      return [];
    }
    
    return data.map((county: { name: string; code?: string; pledge_count: number }) => ({
      name: county.name,
      code: county.code,
      pledgeCount: county.pledge_count || 0
    }));
  } catch (error) {
    logger.error('Error fetching county pledge counts', { error });
    return [];
  }
}

/**
 * County interface for heatmap data
 */
export interface County {
  name: string;
  pledgeCount: number;
  code?: string;
}

/**
 * Pledge interface representing a user pledge
 */
export interface Pledge {
  id: string;
  phone: string;
  county: string;
  amount: number;
  payment_method: string;
  created_at: string;
  transaction_id: string;
  verified: boolean;
}

/**
 * Get all pledges
 * @returns List of pledges
 */
export async function getAllPledges(): Promise<Pledge[]> {
  try {
    const { data, error } = await supabase
      .from('pledges')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    logger.error('Error getting all pledges:', error);
    throw new Error(handleSupabaseError(error, 'Get all pledges'));
  }
}

/**
 * Get a single pledge by ID
 * @param id Pledge ID
 * @returns Pledge data
 */
export async function getPledgeById(id: string): Promise<Pledge | null> {
  try {
    const { data, error } = await supabase
      .from('pledges')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error(`Error getting pledge by ID ${id}:`, error);
    throw new Error(handleSupabaseError(error, 'Get pledge by ID'));
  }
}

/**
 * Get pledges by county
 * @param county County name
 * @returns List of pledges for the county
 */
export async function getPledgesByCounty(county: string): Promise<Pledge[]> {
  try {
    const { data, error } = await supabase
      .from('pledges')
      .select('*')
      .eq('county', county)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    logger.error(`Error getting pledges for county ${county}:`, error);
    throw new Error(handleSupabaseError(error, 'Get pledges by county'));
  }
}

/**
 * Get pledge count by county
 * @returns Map of county names to pledge counts
 */
export async function getPledgeCountByCounty(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('county_pledge_count')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    // Convert data to a map of county names to counts
    const countMap: Record<string, number> = {};
    data?.forEach((item: any) => {
      countMap[item.county] = item.pledge_count;
    });
    
    return countMap;
  } catch (error) {
    logger.error('Error getting pledge count by county:', error);
    throw new Error(handleSupabaseError(error, 'Get pledge count by county'));
  }
}

/**
 * Get counties with pledge counts for a heatmap
 * @returns List of counties with pledge counts
 */
export async function getCountiesWithPledgeCounts(): Promise<County[]> {
  try {
    const { data, error } = await supabase
      .from('county_pledge_count')
      .select('*')
      .order('pledge_count', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Convert to County objects
    const counties: County[] = data?.map((item: any) => ({
      name: item.county,
      pledgeCount: item.pledge_count
    })) || [];
    
    return counties;
  } catch (error) {
    logger.error('Error getting counties with pledge counts:', error);
    throw new Error(handleSupabaseError(error, 'Get counties with pledge counts'));
  }
}

/**
 * Get top counties by pledge count
 * @param limit Number of counties to return
 * @returns List of top counties with pledge counts
 */
export async function getTopCountiesByPledgeCount(limit: number = 5): Promise<County[]> {
  try {
    const { data, error } = await supabase
      .from('county_pledge_count')
      .select('*')
      .order('pledge_count', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    // Convert to County objects
    const counties: County[] = data?.map((item: any) => ({
      name: item.county,
      pledgeCount: item.pledge_count
    })) || [];
    
    return counties;
  } catch (error) {
    logger.error(`Error getting top ${limit} counties by pledge count:`, error);
    throw new Error(handleSupabaseError(error, 'Get top counties by pledge count'));
  }
}

/**
 * Get recent pledges
 * @param limit Number of pledges to return
 * @returns List of recent pledges
 */
export async function getRecentPledges(limit: number = 10): Promise<Pledge[]> {
  try {
    const { data, error } = await supabase
      .from('pledges')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    logger.error(`Error getting recent ${limit} pledges:`, error);
    throw new Error(handleSupabaseError(error, 'Get recent pledges'));
  }
}

/**
 * Get total pledge count
 * @returns Total number of pledges
 */
export async function getTotalPledgeCount(): Promise<number> {
  try {
    const result = await supabase
      .from('pledges')
      .select('*');
    
    if (result.error) {
      handleSupabaseError(result.error, 'Error getting pledge count');
      return 0;
    }
    
    return result.count || 0;
  } catch (error) {
    logger.error('Error getting total pledge count:', error);
    throw new Error(handleSupabaseError(error, 'Get total pledge count'));
  }
}

/**
 * Get total pledge amount
 * @returns Total amount pledged
 */
export async function getTotalPledgeAmount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('sum_pledge_amounts');
    
    if (error) {
      throw error;
    }
    
    return data || 0;
  } catch (error) {
    logger.error('Error getting total pledge amount:', error);
    throw new Error(handleSupabaseError(error, 'Get total pledge amount'));
  }
}

/**
 * Insert a new pledge
 * @param pledge Pledge data to insert
 * @returns Inserted pledge
 */
export async function insertPledge(pledge: Partial<Pledge>): Promise<Pledge | null> {
  try {
    const { data, error } = await supabase
      .from('pledges')
      .insert([pledge], { returning: 'representation' })
      .single();
    
    if (error) {
      handleSupabaseError(error, 'Error inserting pledge');
    }
    
    return data;
  } catch (error) {
    logger.error('Error inserting pledge:', error);
    throw new Error(handleSupabaseError(error, 'Insert pledge'));
  }
}

/**
 * Get total number of pledges
 * @returns Total pledge count
 */
export async function getTotalPledges(): Promise<number> {
  return getTotalPledgeCount();
}
