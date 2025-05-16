import React from 'react';
import Hero from '../components/home/Hero';
import TokenPanel from '../components/home/TokenPanel';
import ShareStrip from '../components/home/ShareStrip';
import CountyMap from '../components/map/CountyMap';
import PledgeTicker from '../components/home/PledgeTicker';

/**
 * Homepage component that combines Hero, TokenPanel, and interactive components
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-primary-black text-white">
      <Hero />
      <TokenPanel />
      
      {/* Kenya Map and Live Pledges section */}
      <section className="py-16 bg-[#111] px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Join Kenyans Across the Country Supporting Change
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CountyMap />
            <PledgeTicker />
          </div>
        </div>
      </section>
      
      <ShareStrip />
    </div>
  );
}
