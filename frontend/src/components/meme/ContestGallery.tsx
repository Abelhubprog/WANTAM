/**
 * Production-ready ContestGallery component for displaying and voting on weekly meme contests
 */
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../lib/utils/logger';

interface ContestGalleryProps {
  className?: string;
  userId?: string; // Optional: pass authenticated user ID
}

interface MemeEntry {
  id: string;
  url: string;
  user: string;
  week: number;
  votes: number;
  created_at: string;
}

/**
 * Displays a gallery of meme contest entries with voting capabilities
 */
export default function ContestGallery({ className = '', userId }: ContestGalleryProps) {
  // State
  const [memes, setMemes] = useState<MemeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [votingDisabled, setVotingDisabled] = useState(false);
  const [votedMemeId, setVotedMemeId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [supabase, setSupabase] = useState<any>(null);
  
  // Initialize Supabase client
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      setSupabase(createClient(supabaseUrl, supabaseKey));
    } else {
      setError('Supabase configuration missing');
      setLoading(false);
    }
  }, []);
  
  // Calculate current week and update time remaining
  useEffect(() => {
    // Calculate current week number
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    const week = Math.ceil(day / 7);
    setCurrentWeek(week);
    
    // Update time remaining
    const updateTimeRemaining = () => {
      const now = new Date();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + (7 - now.getDay()));
      sunday.setHours(23, 59, 59, 999);
      
      const diff = sunday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch memes on component mount
  useEffect(() => {
    if (!supabase || !currentWeek) return;
    
    async function fetchMemes() {
      try {
        setLoading(true);
        logger.info('Fetching memes for week', { week: currentWeek });
        
        // Fetch memes for current week
        const { data, error } = await supabase
          .from('meme_entries')
          .select('*')
          .eq('week', currentWeek)
          .order('votes', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setMemes(data);
          logger.debug('Fetched memes', { count: data.length });
        } else {
          // If no real data, use mock data
          const mockData = getMockMemes(currentWeek);
          setMemes(mockData);
          logger.debug('Using mock meme data', { count: mockData.length });
        }
        
        // Check if user has already voted this week
        if (userId) {
          const { data: voteData, error: voteError } = await supabase
            .from('meme_votes')
            .select('meme_id')
            .eq('user', userId)
            .eq('week', currentWeek)
            .single();
          
          if (!voteError && voteData) {
            setVotingDisabled(true);
            setVotedMemeId(voteData.meme_id);
            logger.debug('User already voted', { 
              userId, 
              memeId: voteData.meme_id 
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error fetching memes', { error: err });
        setError(`Failed to load memes: ${errorMessage}`);
        
        // Use mock data on error
        setMemes(getMockMemes(currentWeek));
        setLoading(false);
      }
    }
    
    fetchMemes();
    
    // Set up real-time subscription for votes
    if (supabase) {
      const subscription = supabase
        .channel('meme-votes')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'meme_entries' }, 
          (payload: any) => {
            // Update the vote count in the UI
            setMemes(currentMemes => {
              return currentMemes.map(meme => {
                if (meme.id === payload.new.id) {
                  return { ...meme, votes: payload.new.votes };
                }
                return meme;
              }).sort((a, b) => b.votes - a.votes); // Re-sort by votes
            });
            
            logger.debug('Real-time vote update', { 
              memeId: payload.new.id, 
              votes: payload.new.votes 
            });
          }
        )
        .subscribe();
        
      logger.debug('Subscribed to meme vote updates');
        
      return () => {
        logger.debug('Unsubscribing from meme vote updates');
        supabase.removeChannel(subscription);
      };
    }
  }, [userId, supabase, currentWeek]);
  
  // Generate mock memes for development/demo
  function getMockMemes(week: number): MemeEntry[] {
    const mockMemes: MemeEntry[] = [];
    
    // Sample meme URLs (in production, these would be real meme URLs)
    const sampleUrls = [
      'https://images.unsplash.com/photo-1569017388730-020b5dd5eb76', // Kenyan protest
      'https://images.unsplash.com/photo-1511578314322-379afb476865', // Political cartoon concept
      'https://images.unsplash.com/photo-1579493934830-eab45746b51b', // Social media concept
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f', // Democracy concept
      'https://images.unsplash.com/photo-1503428593586-e225b39bddfe', // People gathered
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f', // Hand raised
      'https://images.unsplash.com/photo-1571624436279-b272aff752b5', // Protest sign
      'https://images.unsplash.com/photo-1569164942237-89a63815e066'  // Crowd
    ];
    
    for (let i = 0; i < 8; i++) {
      mockMemes.push({
        id: `mock-${i}`,
        url: sampleUrls[i] || sampleUrls[0],
        user: `user-${Math.floor(Math.random() * 1000)}`,
        week: week,
        votes: Math.floor(Math.random() * 50),
        created_at: new Date().toISOString()
      });
    }
    
    // Sort by votes (descending)
    return mockMemes.sort((a, b) => b.votes - a.votes);
  }
  
  // Handle vote click
  const handleVote = useCallback(async (memeId: string) => {
    if (!userId || votingDisabled) return;
    
    try {
      setError(null);
      logger.info('Voting for meme', { memeId, userId });
      
      const response = await fetch('/api/memes/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: memeId,
          userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to vote');
      }
      
      // Update UI
      setVotingDisabled(true);
      setVotedMemeId(memeId);
      
      // Increment vote count locally for instant feedback
      setMemes(currentMemes => {
        const updatedMemes = currentMemes.map(meme => {
          if (meme.id === memeId) {
            return { ...meme, votes: meme.votes + 1 };
          }
          return meme;
        });
        
        // Re-sort by votes
        return updatedMemes.sort((a, b) => b.votes - a.votes);
      });
      
      logger.info('Vote successful', { memeId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      logger.error('Error voting', { error: err, memeId });
      setError(errorMessage);
    }
  }, [userId, votingDisabled]);

  // Share meme handler
  const handleShare = useCallback((meme: MemeEntry) => {
    try {
      // Construct share data
      const shareData = {
        title: 'WANTAM Meme Contest',
        text: `Check out this meme from the WANTAM weekly contest! Currently has ${meme.votes} votes.`,
        url: meme.url
      };
      
      // Use Web Share API if available
      if (navigator.share) {
        navigator.share(shareData)
          .then(() => logger.info('Shared successfully', { memeId: meme.id }))
          .catch((error) => logger.error('Error sharing', { error }));
      } else {
        // Fallback to clipboard copy
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
          .then(() => {
            alert('Share link copied to clipboard!');
            logger.info('Copied to clipboard', { memeId: meme.id });
          })
          .catch((error) => logger.error('Error copying to clipboard', { error }));
      }
    } catch (error) {
      logger.error('Share error', { error });
    }
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-40 ${className}`}>
        <div className="w-10 h-10 border-t-4 border-kenyan-green rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`bg-kenyan-red/20 p-4 rounded-xl ${className}`}>
        <p className="text-white">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-kenyan-red/70 hover:bg-kenyan-red text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Weekly Meme Contest</h2>
        <p className="text-white/70 mt-2">
          Week {currentWeek} · Voting ends in {timeRemaining}
        </p>
      </div>
      
      {/* Contest instructions */}
      <div className="bg-primary-black/30 border border-white/10 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-2">How It Works</h3>
        <ul className="text-white/80 list-disc pl-5 space-y-1">
          <li>Every week features new WANTAM-themed memes</li>
          <li>Each verified user gets one vote per week</li>
          <li>Winning meme is featured on our social channels</li>
          <li>Contest resets every Sunday at midnight EAT</li>
        </ul>
      </div>
      
      {memes.length === 0 ? (
        <div className="text-center py-12 bg-primary-black/20 rounded-xl">
          <p className="text-white text-xl">No memes submitted yet this week</p>
          <p className="text-white/70 mt-2">Be the first to submit a meme!</p>
          <button
            onClick={() => window.location.href = '/memes/submit'}
            className="mt-6 px-6 py-3 bg-kenyan-red hover:bg-kenyan-red/90 text-white rounded-lg"
          >
            Submit a Meme
          </button>
        </div>
      ) : (
        <>
          {/* Masonry grid of memes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {memes.map((meme, index) => (
              <div 
                key={meme.id} 
                className="group relative bg-primary-black/30 border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/30"
              >
                {/* Meme image */}
                <div className="aspect-square overflow-hidden bg-primary-black/50">
                  <img 
                    src={meme.url} 
                    alt="Meme entry" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Overlay with vote count and button */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-kenyan-green mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-white">{meme.votes} votes</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShare(meme)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                      aria-label="Share meme"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleVote(meme.id)}
                      disabled={votingDisabled || !userId}
                      className={`px-3 py-1 rounded-lg ${
                        votedMemeId === meme.id
                          ? 'bg-kenyan-green text-white'
                          : votingDisabled
                          ? 'bg-white/10 text-white/50 cursor-not-allowed'
                          : 'bg-white/20 hover:bg-kenyan-green/80 text-white'
                      }`}
                    >
                      {votedMemeId === meme.id ? 'Voted' : 'Upvote'}
                    </button>
                  </div>
                </div>
                
                {/* Leader badge for top meme */}
                {index === 0 && (
                  <div className="absolute top-2 right-2 bg-gold text-primary-black text-xs font-bold px-2 py-1 rounded-full z-10">
                    LEADER
                  </div>
                )}
                
                {/* New badge for recent submissions */}
                {new Date().getTime() - new Date(meme.created_at).getTime() < 24 * 60 * 60 * 1000 && (
                  <div className="absolute top-2 left-2 bg-kenyan-red text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    NEW
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination would go here for lots of entries */}
        </>
      )}
      
      {/* Submit your own meme section */}
      <div className="mt-12 p-6 bg-primary-black/30 border border-white/10 rounded-xl text-center">
        <h3 className="text-xl font-bold text-white mb-2">Submit Your Own Meme</h3>
        <p className="text-white/70 mb-4">
          Create a WANTAM-themed meme and enter the weekly contest!
        </p>
        <button
          onClick={() => window.location.href = '/memes/submit'}
          className="px-6 py-3 bg-kenyan-red hover:bg-kenyan-red/90 text-white rounded-lg"
        >
          Submit a Meme
        </button>
      </div>
      
      {/* Not verified warning */}
      {!votingDisabled && !userId && (
        <div className="mt-6 p-4 bg-kenyan-red/20 border border-kenyan-red/50 rounded-xl">
          <p className="text-white">
            Sign in and verify with MPESA to vote in the meme contest.
          </p>
        </div>
      )}
    </div>
  );
}
