import React from 'react';
import { getTotalPledgeCount } from '../../lib/supabase/pledges';
import { Card } from '../ui/card';

/**
 * CSS keyframes for animation - added to App.css
 * @keyframes fadeIn {
 *   from { opacity: 0; transform: translateY(10px); }
 *   to { opacity: 1; transform: translateY(0); }
 * }
 */

/**
 * Displays a wall of pledges from people across Kenya
 */
export default function Wall() {
  const [totalPledges, setTotalPledges] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPledges = async () => {
      setIsLoading(true);
      try {
        const count = await getTotalPledgeCount();
        setTotalPledges(count);
      } catch (error) {
        console.error('Error fetching pledges:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPledges();
  }, []);

  // This would be replaced with actual data in a production app
  const pledges = [
    { id: 1, name: 'James Odhiambo', county: 'Nairobi', timestamp: '2 hours ago' },
    { id: 2, name: 'Sarah Njeri', county: 'Kiambu', timestamp: '5 hours ago' },
    { id: 3, name: 'Ahmed Hassan', county: 'Mombasa', timestamp: '7 hours ago' },
    { id: 4, name: 'Lucy Wambui', county: 'Nakuru', timestamp: '12 hours ago' },
    { id: 5, name: 'Daniel Kipchoge', county: 'Uasin Gishu', timestamp: '1 day ago' },
    { id: 6, name: 'Faith Akinyi', county: 'Kisumu', timestamp: '1 day ago' },
    { id: 7, name: 'Tom Mwangi', county: 'Nyeri', timestamp: '2 days ago' },
    { id: 8, name: 'Grace Kemunto', county: 'Kisii', timestamp: '2 days ago' },
    { id: 9, name: 'Patrick Onyango', county: 'Siaya', timestamp: '3 days ago' },
    { id: 10, name: 'Mercy Kanini', county: 'Machakos', timestamp: '3 days ago' },
    { id: 11, name: 'Robert Kipkorir', county: 'Kericho', timestamp: '4 days ago' },
    { id: 12, name: 'Alice Wafula', county: 'Bungoma', timestamp: '4 days ago' },
  ];

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-primary-black to-primary-black/80">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Pledge Wall</h2>
        
        <div className="flex justify-center items-center mb-8">
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-6 h-6 border-t-2 border-kenyan-red rounded-full animate-spin mr-2"></div>
              <p className="text-white/70">Loading pledges...</p>
            </div>
          ) : (
            <p className="text-white/70 text-xl">
              Join <span className="text-kenyan-red font-bold text-2xl">{totalPledges.toLocaleString()}</span> Kenyans who have pledged for change
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {pledges.map((pledge, index) => (
            <Card 
              key={pledge.id} 
              className="text-center p-4 bg-primary-black/50 backdrop-blur-sm border border-white/10 hover:border-kenyan-red/50 transition-all pledge-card"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-kenyan-red/20 flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-white">{pledge.name.charAt(0)}</span>
                </div>
                <p className="font-bold text-white text-lg">{pledge.name}</p>
                <p className="text-white/70">{pledge.county} County</p>
                <p className="text-white/40 text-sm mt-2">{pledge.timestamp}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
