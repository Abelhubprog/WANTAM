import React from 'react';
import { Button } from '../ui/button';

/**
 * ShareStrip component with one-click share buttons for social media
 */
export default function ShareStrip() {
  // Pre-filled text for social sharing
  const shareText = "I've pledged to make Kenya a One-Term country. Join the movement at wantam.ink #WANTAM #OneTermOnly";
  
  // Share handlers
  const shareOnX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };
  
  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };
  
  const shareOnTelegram = () => {
    const url = `https://t.me/share/url?url=https://wantam.ink&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-10 px-4 bg-kenyan-green">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Spread the Movement
        </h2>
        <p className="text-white/90 mb-8 max-w-3xl mx-auto">
          Share the WANTAM pledge with your network and help us reach every corner of Kenya.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            variant="gold" 
            className="flex items-center gap-2"
            onClick={shareOnX}
            aria-label="Share on X (Twitter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
            Share on X
          </Button>
          
          <Button 
            variant="gold" 
            className="flex items-center gap-2"
            onClick={shareOnWhatsApp}
            aria-label="Share on WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.2.301-.777.966-.95 1.164-.173.199-.347.223-.647.075-.3-.15-1.269-.468-2.419-1.491-.896-.795-1.497-1.77-1.676-2.07-.173-.3-.018-.462.13-.612.134-.13.3-.339.448-.505.149-.169.198-.285.297-.477.1-.191.05-.358-.025-.506-.075-.149-.672-1.62-.922-2.22-.24-.579-.487-.5-.673-.51-.173-.008-.372-.01-.572-.01-.2 0-.52.074-.79.372-.274.3-1.046 1.016-1.044 2.479.001 1.463 1.064 2.875 1.213 3.074.149.2 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 22.5c-2.979 0-5.77-1.168-7.853-3.293C1.93 16.967.7 14.113.7 11.077c0-6.627 5.44-12.037 12.044-12.037 3.274 0 6.328 1.282 8.63 3.61 2.303 2.327 3.566 5.427 3.566 8.688 0 6.705-5.48 12.16-12.042 12.16z"/>
            </svg>
            Share on WhatsApp
          </Button>
          
          <Button 
            variant="gold" 
            className="flex items-center gap-2"
            onClick={shareOnTelegram}
            aria-label="Share on Telegram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 12c0 5.247-4.253 9.5-9.5 9.5S2.5 17.247 2.5 12 6.753 2.5 12 2.5s9.5 4.253 9.5 9.5z"/>
              <path d="M17 8.5l-7.333 4.391a.5.5 0 0 0-.032.866l1.869 1.24a.5.5 0 0 0 .553.033L17 12"/>
              <path d="M8.5 15.5l1.8-1.8"/>
            </svg>
            Share on Telegram
          </Button>
        </div>
      </div>
    </section>
  );
}
