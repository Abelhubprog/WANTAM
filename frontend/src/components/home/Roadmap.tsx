import React from 'react';
import { Card } from '../ui/card';

/**
 * Roadmap component that displays the project's phases and milestones
 */
export default function Roadmap() {
  // Current phase (1, 2, or 3)
  const currentPhase = 1;
  
  const phases = [
    {
      phase: 1,
      title: "Movement Launch",
      items: [
        "Website Launch",
        "Social Media Setup",
        "Community Building",
        "Smart Contract Deployment",
        "Initial Marketing Push"
      ],
      status: currentPhase >= 1 ? 'active' : 'upcoming'
    },
    {
      phase: 2,
      title: "Growth & Expansion",
      items: [
        "DEX Listing",
        "CoinGecko Listing",
        "CMC Listing",
        "Partnerships Announcement",
        "Enhanced Marketing"
      ],
      status: currentPhase >= 2 ? 'active' : 'upcoming'
    },
    {
      phase: 3,
      title: "Mass Adoption",
      items: [
        "CEX Listings",
        "Platform Integration",
        "Ecosystem Expansion",
        "Global Marketing Campaign",
        "Community Governance"
      ],
      status: currentPhase >= 3 ? 'active' : 'upcoming'
    }
  ];

  return (
    <section className="py-16 px-4 bg-primary-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Roadmap</h2>
        <p className="text-white/70 text-center mb-12 max-w-2xl mx-auto">
          Our step-by-step plan to revolutionize Kenya's political landscape
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {phases.map((phase) => (
            <Card 
              key={phase.phase}
              className={`border-t-4 ${
                phase.status === 'active' 
                  ? 'border-t-kenyan-green bg-primary-black/90' 
                  : 'border-t-white/20 bg-primary-black/60'
              } border-white/10 relative overflow-hidden`}
            >
              {phase.status === 'active' && (
                <div className="absolute top-2 right-2 flex items-center text-xs text-kenyan-green">
                  <span className="inline-block w-2 h-2 rounded-full bg-kenyan-green mr-1 animate-pulse"></span>
                  In Progress
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-6xl font-bold text-white/20">{phase.phase}</span>
                  <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                </div>
                
                <ul className="space-y-3">
                  {phase.items.map((item, index) => (
                    <li 
                      key={index} 
                      className="flex items-center text-white/80"
                    >
                      {phase.status === 'active' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-kenyan-green mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/40 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}