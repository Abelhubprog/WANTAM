import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import kenyanCounties from '../../data/kenyan-counties.json';
import { subscribeToTable, unsubscribeFromTable } from '../../lib/supabase/realtime';
import { supabase } from '../../lib/supabase/client';
import { logger } from '../../lib/utils/logger';

interface CountyData {
  id: string;
  name: string;
  path: string;
  population?: number;
  pledgeCount: number;
  centroid?: [number, number]; // Adding the centroid property
}

interface CountyPledgeCount {
  county: string;
  pledge_count: number;
}

const CountyMap: React.FC = () => {
  const [counties, setCounties] = useState<CountyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [highlightedCounty, setHighlightedCounty] = useState<string | null>(null);

  // Calculate highest pledge count for normalization
  const maxPledgeCount = Math.max(...counties.map(county => county.pledgeCount || 0), 1);

  // Function to normalize pledge count to a color intensity (0-1)
  const normalizeIntensity = (pledgeCount: number): number => {
    return Math.min(0.1 + (pledgeCount / maxPledgeCount) * 0.9, 1);
  };

  // Function to get color based on pledge count
  const getCountyColor = (county: CountyData): string => {
    if (selectedCounty === county.name || highlightedCounty === county.name) {
      return 'rgb(239, 68, 68)'; // Highlighted red color
    }
    const intensity = normalizeIntensity(county.pledgeCount || 0);
    // Generate a shade of green based on intensity
    const r = Math.floor(16 + (255 - 16) * (1 - intensity));
    const g = Math.floor(185 + (255 - 185) * (1 - intensity));
    const b = Math.floor(16 + (255 - 16) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Load initial county data from Supabase
  const loadCountyData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get pledge counts by county from Supabase
      const { data: pledgeCounts, error } = await supabase
        .from('county_pledge_count')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Map the county data from the JSON with the pledge counts
      const countyData = (kenyanCounties as any).features.map((feature: any) => {
        const countyName = feature.properties.name;
        const pledgeData = pledgeCounts?.find((p: CountyPledgeCount) => 
          p.county.toLowerCase() === countyName.toLowerCase()
        );
        
        return {
          id: feature.id,
          name: countyName,
          path: feature.path || '',
          population: feature.properties.population || 0,
          pledgeCount: pledgeData?.pledge_count || 0,
          centroid: feature.centroid || [0, 0] // Add centroid data
        };
      });
      
      setCounties(countyData);
    } catch (error) {
      logger.error('Error loading county data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    loadCountyData();
    
    // Subscribe to pledge table changes
    const subId = subscribeToTable('pledges', 'INSERT', (payload) => {
      const newPledge = payload.new;
      if (!newPledge || !newPledge.county) return;
      
      // Highlight the county that just received a new pledge
      setHighlightedCounty(newPledge.county);
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedCounty(null);
      }, 3000);
      
      // Update county data with new pledge
      setCounties(prevCounties => {
        return prevCounties.map(county => {
          if (county.name.toLowerCase() === newPledge.county.toLowerCase()) {
            return {
              ...county,
              pledgeCount: county.pledgeCount + 1
            };
          }
          return county;
        });
      });
    });
    
    setSubscriptionId(subId);
    
    // Cleanup subscription on unmount
    return () => {
      if (subscriptionId) {
        unsubscribeFromTable(subscriptionId);
      }
    };
  }, [loadCountyData]);

  // Handle county selection
  const handleCountyClick = (county: CountyData) => {
    setSelectedCounty(county.name === selectedCounty ? null : county.name);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
        County Pledge Map
      </h2>
      
      <div className="mb-4 text-center text-sm text-gray-600">
        Click on a county to see details. Darker green indicates more pledges.
      </div>
      
      <div className="relative w-full aspect-[3/4] md:aspect-[4/3] lg:aspect-[16/9] mx-auto">
        <svg 
          viewBox="0 0 1000 800" 
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {counties.map((county) => (
            <motion.path
              key={county.id}
              d={county.path}
              fill={getCountyColor(county)}
              stroke="#FFFFFF"
              strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{ 
                scale: 1.02, 
                filter: 'drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.3))' 
              }}
              onClick={() => handleCountyClick(county)}
              style={{ cursor: 'pointer' }}
            />
          ))}
          
          {/* Display county names for larger screens */}
          {counties.map((county) => (
            <text
              key={`text-${county.id}`}
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#333333"
              fontSize="8"
              fontWeight="bold"
              className="hidden md:block pointer-events-none"
              transform={`translate(${county.centroid?.[0] || 0}, ${county.centroid?.[1] || 0})`}
            >
              {county.name}
            </text>
          ))}
        </svg>
      </div>
      
      {/* Selected county information */}
      {selectedCounty && (
        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
          <h3 className="font-bold text-gray-800">
            {selectedCounty}
          </h3>
          <p className="text-sm text-gray-600">
            Pledges: <span className="font-bold text-green-600">
              {counties.find(c => c.name === selectedCounty)?.pledgeCount || 0}
            </span>
          </p>
        </div>
      )}
      
      {/* Color legend */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-[rgb(16,185,16)]"></div>
          <span className="ml-1 text-xs text-gray-600">Few Pledges</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[rgb(16,255,16)]"></div>
          <span className="ml-1 text-xs text-gray-600">Many Pledges</span>
        </div>
      </div>
    </div>
  );
};

export default CountyMap;
