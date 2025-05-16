import React from 'react';
import { Button } from '../ui/button';

/**
 * Hero component for the homepage with headline, subheading, and CTA buttons
 */
export default function Hero() {
  return (
    <section 
      className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-16 text-center bg-gradient-to-br from-primary-black to-primary-black/95 relative"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1592530392525-9d8469678dac")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-black/80 to-primary-black/90"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-4xl mx-auto">
          Make Kenya a <span className="text-kenyan-red">One-Term</span> Country.
        </h1>
        <h2 className="text-2xl md:text-3xl font-medium text-white/80 mb-10 max-w-2xl mx-auto">
          No Second Chances for Corruption.
        </h2>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Button variant="gold" size="lg" aria-label="Buy $WANTAM token" className="px-8 py-6 text-xl">
            Buy $WANTAM
          </Button>
          <Button variant="green" size="lg" aria-label="Join the movement" className="px-8 py-6 text-xl">
            Join the Movement
          </Button>
          <Button variant="outline" size="lg" aria-label="See campaigns" className="px-8 py-6 text-xl">
            See Campaigns
          </Button>
        </div>
      </div>
    </section>
  );
}
