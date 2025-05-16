/**
 * County Map component for visualizing pledge data across Kenya
 */
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface CountyMapProps {
  className?: string;
}

interface CountyData {
  [county: string]: number;
}

/**
 * Renders a heat map of Kenya counties colored based on pledge counts
 */
export default function CountyMap({ className = '' }: CountyMapProps) {
  const [countyData, setCountyData] = useState<CountyData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch county data on component mount
  useEffect(() => {
    async function fetchCountyData() {
      try {
        const response = await fetch('/api/pledges');
        if (!response.ok) {
          throw new Error('Failed to fetch county data');
        }
        const data = await response.json();
        setCountyData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching county data:', err);
        setError('Could not load county data');
        setLoading(false);
      }
    }

    fetchCountyData();

    // Set up real-time subscription if needed
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Subscribe to changes in the pledges table
      const subscription = supabase
        .channel('county-updates')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'pledges' }, 
          () => {
            // Refresh data when new pledges are added
            fetchCountyData();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, []);

  /**
   * Get county color based on pledge count
   * Scale: [0,5,20,50,100] → grey → green gradient
   */
  const getCountyColor = (county: string): string => {
    const count = countyData[county] || 0;
    
    if (count === 0) return '#444444'; // grey for zero
    if (count < 5) return '#566a53'; // very light green
    if (count < 20) return '#4a8a43'; // light green
    if (count < 50) return '#2a7023'; // medium green
    if (count < 100) return '#0F893A'; // bright green
    return '#005c20'; // deep green for high counts
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-t-4 border-kenyan-green rounded-full animate-spin mb-4"></div>
          <p className="text-white opacity-80">Loading county data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-kenyan-red">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white">County Participation</h2>
        <p className="text-white/70 mt-2">
          See which counties are leading the WANTAM movement
        </p>
      </div>
      
      <div className="relative max-w-4xl mx-auto h-[500px] border border-white/10 rounded-2xl p-4 bg-primary-black/30 overflow-hidden">
        {/* Replace this with the actual SVG map from public/kenya-counties.svg */}
        <svg 
          viewBox="0 0 800 900" 
          className="w-full h-full max-w-2xl mx-auto"
          aria-label="Map of Kenya counties"
        >
          {/* This is a simplified placeholder. The real map would use the SVG from public/kenya-counties.svg */}
          <path 
            d="M400,100 L500,150 L550,300 L600,400 L550,500 L500,600 L450,700 
               L400,800 L350,700 L300,600 L250,500 L200,400 L250,300 L300,150 Z" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="2"
            className="opacity-70"
          />
          
          {/* Sample county polygons with dynamic colors */}
          <path 
            d="M350,200 L400,250 L380,300 L330,280 Z" 
            fill={getCountyColor('Nairobi')}
            className="opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
            data-county="Nairobi"
          />
          
          <path 
            d="M420,300 L470,320 L450,370 L400,350 Z" 
            fill={getCountyColor('Kiambu')}
            className="opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
            data-county="Kiambu"
          />
          
          <path 
            d="M300,500 L350,530 L340,580 L290,560 Z" 
            fill={getCountyColor('Mombasa')}
            className="opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
            data-county="Mombasa"
          />

          <path 
            d="M250,400 L300,420 L290,470 L240,450 Z" 
            fill={getCountyColor('Kisumu')}
            className="opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
            data-county="Kisumu"
          />

          <path 
            d="M450,450 L500,470 L490,520 L440,500 Z" 
            fill={getCountyColor('Machakos')}
            className="opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
            data-county="Machakos"
          />

          <path 
            d="M500,200 L550,220 L540,270 L490,250 Z" 
            fill={getCountyColor('Garissa')}
            className="opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
            data-county="Garissa"
          />
          
          {/* Stats overlay */}
          <g className="text-lg font-bold" fill="white">
            <text x="400" y="50" textAnchor="middle">47 Counties</text>
            <text x="400" y="850" textAnchor="middle">Leading the One Term Movement</text>
          </g>
        </svg>
      </div>
      
      <div className="mt-6 text-white/70 flex justify-center items-center space-x-6 flex-wrap">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#444444] rounded-full mr-2"></div>
          <span>No pledges</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#566a53] rounded-full mr-2"></div>
          <span>&lt; 5 pledges</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#4a8a43] rounded-full mr-2"></div>
          <span>5-20 pledges</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#2a7023] rounded-full mr-2"></div>
          <span>20-50 pledges</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#0F893A] rounded-full mr-2"></div>
          <span>50-100 pledges</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#005c20] rounded-full mr-2"></div>
          <span>&gt; 100 pledges</span>
        </div>
      </div>
    </div>
  );
}
