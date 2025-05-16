import React from 'react';

/**
 * Displays a map of Kenya with counties highlighted based on pledge data
 */
export default function CountyMap() {
  return (
    <div className="py-12 px-4 bg-primary-black">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-8">County Participation</h2>
        
        {/* This is a static placeholder SVG for Kenya counties */}
        <div className="relative w-full h-[500px] border border-white/10 rounded-2xl p-4 bg-primary-black overflow-hidden">
          <svg 
            viewBox="0 0 800 900" 
            className="w-full h-full max-w-2xl mx-auto"
            aria-label="Map of Kenya counties"
          >
            {/* Simple Kenya outline as placeholder */}
            <path 
              d="M400,100 L500,150 L550,300 L600,400 L550,500 L500,600 L450,700 
                 L400,800 L350,700 L300,600 L250,500 L200,400 L250,300 L300,150 Z" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="2"
              className="opacity-70"
            />
            
            {/* Sample county polygons */}
            <path 
              d="M350,200 L400,250 L380,300 L330,280 Z" 
              fill="#DC2727" 
              className="opacity-50 hover:opacity-80 cursor-pointer"
              data-county="Nairobi"
            />
            
            <path 
              d="M420,300 L470,320 L450,370 L400,350 Z" 
              fill="#0F893A" 
              className="opacity-50 hover:opacity-80 cursor-pointer"
              data-county="Kiambu"
            />
            
            <path 
              d="M300,500 L350,530 L340,580 L290,560 Z" 
              fill="#FFD600" 
              className="opacity-50 hover:opacity-80 cursor-pointer"
              data-county="Mombasa"
            />

            <path 
              d="M250,400 L300,420 L290,470 L240,450 Z" 
              fill="#DC2727" 
              className="opacity-50 hover:opacity-80 cursor-pointer"
              data-county="Kisumu"
            />

            <path 
              d="M450,450 L500,470 L490,520 L440,500 Z" 
              fill="#0F893A" 
              className="opacity-50 hover:opacity-80 cursor-pointer"
              data-county="Machakos"
            />

            <path 
              d="M500,200 L550,220 L540,270 L490,250 Z" 
              fill="#FFD600" 
              className="opacity-50 hover:opacity-80 cursor-pointer"
              data-county="Garissa"
            />
            
            {/* Stats overlay */}
            <g className="text-lg font-bold" fill="white">
              <text x="400" y="50" textAnchor="middle">47 Counties</text>
              <text x="400" y="850" textAnchor="middle">2,111,020 Pledges</text>
            </g>
          </svg>
        </div>
        
        <div className="mt-6 text-white/70 flex justify-center items-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-kenyan-red rounded-full mr-2"></div>
            <span>High participation</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-kenyan-green rounded-full mr-2"></div>
            <span>Medium participation</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gold rounded-full mr-2"></div>
            <span>Growing participation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
