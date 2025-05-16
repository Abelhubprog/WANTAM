import React from 'react';
import Wall from '../components/pledge/Wall';
import CountyMap from '../components/pledge/CountyMap';
import AddPledgeModal from '../components/pledge/AddPledgeModal';

/**
 * Pledge page component that combines Wall, CountyMap, and AddPledgeModal
 */
export default function PledgePage() {
  return (
    <div className="min-h-screen bg-primary-black text-white">
      <div className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          The WANTAM <span className="text-kenyan-red">Pledge Wall</span>
        </h1>
        <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
          Join thousands of Kenyans committed to making our country a 
          <span className="font-bold text-gold"> one-term-only </span> 
          place for corrupt leaders.
        </p>
        <AddPledgeModal />
      </div>
      
      <Wall />
      <CountyMap />
    </div>
  );
}
