import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToTable, unsubscribeFromTable } from '../../lib/supabase/realtime';
import { logger } from '../../lib/utils/logger';

interface PledgeInfo {
  id: string;
  county: string;
  created_at: string;
  phone?: string;
}

const PledgeTicker: React.FC = () => {
  const [pledges, setPledges] = useState<PledgeInfo[]>([]);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  
  // Format phone number to hide middle digits
  const formatPhone = (phone: string): string => {
    if (!phone) return '';
    // Only show first 4 and last 2 digits
    const visible = phone.slice(0, 4) + '****' + phone.slice(-2);
    return visible;
  };
  
  // Format timestamp to relative time
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };
  
  // Set up realtime subscription for new pledges
  useEffect(() => {
    // Subscribe to new pledges
    const subId = subscribeToTable('pledges', 'INSERT', (payload) => {
      const newPledge = payload.new;
      if (!newPledge) return;
      
      // Add the new pledge to the list
      setPledges(prevPledges => {
        // Only keep the 10 most recent pledges
        const updatedPledges = [
          {
            id: newPledge.id,
            county: newPledge.county,
            created_at: newPledge.created_at,
            phone: newPledge.phone
          },
          ...prevPledges
        ].slice(0, 10);
        
        return updatedPledges;
      });
    });
    
    setSubscriptionId(subId);
    
    // Load initial pledges
    const loadInitialPledges = async () => {
      try {
        // This would be a Supabase query in production
        // For now, we'll generate some sample data
        const samplePledges: PledgeInfo[] = Array.from({ length: 5 }, (_, i) => ({
          id: `sample-${i}`,
          county: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'][i],
          created_at: new Date(Date.now() - i * 60000).toISOString(),
          phone: `2547${Math.floor(10000000 + Math.random() * 90000000)}`
        }));
        
        setPledges(samplePledges);
      } catch (error) {
        logger.error('Error loading initial pledges:', error);
      }
    };
    
    loadInitialPledges();
    
    // Clean up subscription on unmount
    return () => {
      if (subscriptionId) {
        unsubscribeFromTable(subscriptionId);
      }
    };
  }, []);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Live Pledges
      </h2>
      
      <div 
        ref={tickerRef}
        className="max-h-64 overflow-y-auto"
      >
        <AnimatePresence>
          {pledges.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No pledges yet. Be the first to pledge!
            </div>
          ) : (
            pledges.map((pledge) => (
              <motion.div
                key={pledge.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="flex items-center p-3 mb-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {formatPhone(pledge.phone || '')}
                  </div>
                  <div className="text-sm text-gray-500">
                    pledged from {pledge.county}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {formatTime(pledge.created_at)}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PledgeTicker;
