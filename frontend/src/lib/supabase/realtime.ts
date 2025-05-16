import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/realtime-js';
import { logger } from '../utils/logger';

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Create a Supabase client for realtime subscriptions
const supabaseRealtime = createClient(supabaseUrl, supabaseAnonKey);

interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  callback: (payload: any) => void;
}

// Store active subscriptions
const activeSubscriptions: Record<string, RealtimeSubscription> = {};

/**
 * Subscribe to realtime changes on a Supabase table
 * @param {string} table - The name of the table to subscribe to
 * @param {string} event - The event to subscribe to ('INSERT', 'UPDATE', 'DELETE', '*')
 * @param {function} callback - The callback function to call when the event occurs
 * @returns {string} - The subscription ID
 */
export const subscribeToTable = (
  table: string, 
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*', 
  callback: (payload: any) => void
): string => {
  try {
    const subscriptionId = `${table}:${event}:${Date.now()}`;
    
    // Create a channel to the table
    const channel = supabaseRealtime
      .channel(subscriptionId)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
        },
        (payload: any) => {
          logger.info(`Realtime event received for ${table}:${event}`, { payload });
          callback(payload);
        }
      )
      .subscribe((status: { event: string; subscription: any }) => {
        logger.info(`Realtime subscription status for ${table}:${event}:`, status);
      });

    // Store the subscription
    activeSubscriptions[subscriptionId] = {
      id: subscriptionId,
      channel,
      table,
      event,
      callback,
    };

    logger.info(`Subscribed to ${table}:${event} with ID ${subscriptionId}`);
    return subscriptionId;
  } catch (error) {
    logger.error(`Error subscribing to ${table}:${event}:`, error);
    throw error;
  }
};

/**
 * Unsubscribe from a realtime subscription
 * @param {string} subscriptionId - The ID of the subscription to unsubscribe from
 * @returns {boolean} - Whether the unsubscription was successful
 */
export const unsubscribeFromTable = (subscriptionId: string): boolean => {
  try {
    const subscription = activeSubscriptions[subscriptionId];
    if (!subscription) {
      logger.warn(`Subscription ${subscriptionId} not found`);
      return false;
    }

    // Unsubscribe from the channel
    subscription.channel.unsubscribe();
    
    // Remove the subscription from active subscriptions
    delete activeSubscriptions[subscriptionId];
    
    logger.info(`Unsubscribed from ${subscription.table}:${subscription.event} with ID ${subscriptionId}`);
    return true;
  } catch (error) {
    logger.error(`Error unsubscribing from ${subscriptionId}:`, error);
    return false;
  }
};

/**
 * Get current active subscriptions
 * @returns {Record<string, RealtimeSubscription>} - Active subscriptions
 */
export const getActiveSubscriptions = (): Record<string, RealtimeSubscription> => {
  return { ...activeSubscriptions };
};

/**
 * Unsubscribe from all realtime subscriptions
 */
export const unsubscribeAll = (): void => {
  try {
    Object.keys(activeSubscriptions).forEach((subscriptionId) => {
      unsubscribeFromTable(subscriptionId);
    });
    
    logger.info('Unsubscribed from all realtime subscriptions');
  } catch (error) {
    logger.error('Error unsubscribing from all realtime subscriptions:', error);
  }
};

export default {
  subscribeToTable,
  unsubscribeFromTable,
  getActiveSubscriptions,
  unsubscribeAll,
};
