import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('REACT_APP_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('REACT_APP_SUPABASE_ANON_KEY');
  
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Create a single instance of the Supabase client to be used throughout the app
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-fallback-url.supabase.co', 
  supabaseAnonKey || 'placeholder-fallback-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-application-name': 'wantam-ink-frontend',
      },
    },
  }
);

/**
 * Handle errors from Supabase client calls
 */
export function handleSupabaseError(error: any, context: string = 'Supabase operation'): string {
  if (!error) return '';
  
  logger.error(`${context} error:`, error);
  
  // Format user-friendly error message
  if (error.code) {
    switch (error.code) {
      case 'PGRST301':
        return 'Resource not found.';
      case 'PGRST204':
        return 'No content available.';
      case '23505':
        return 'This record already exists.';
      case '23503':
        return 'This operation would violate constraints.';
      case '42P01':
        return 'The requested resource does not exist.';
      case '42501':
        return 'You don\'t have permission to perform this action.';
      case '22P02':
        return 'Invalid data format.';
      case 'P0001':
        return error.message || 'Database constraint violation.';
      case 'PGRST116':
        return 'Too many results requested.';
      default:
        if (error.message && typeof error.message === 'string') {
          return error.message;
        }
    }
  }
  
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }
  
  return 'An error occurred. Please try again later.';
}

export default supabase;
