import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui/button';
import { insertPledge } from '../../lib/supabase/pledges';

/**
 * Modal for adding a new pledge to the wall
 */
export default function AddPledgeModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [county, setCounty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Kenya counties list
  const counties = [
    'Nairobi', 'Kiambu', 'Mombasa', 'Nakuru', 'Uasin Gishu', 
    'Kisumu', 'Nyeri', 'Kisii', 'Kakamega', 'Machakos',
    'Kilifi', 'Bungoma', 'Kajiado', 'Kericho', 'Bomet',
    // Add all counties here in the full implementation
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !county) return;
    
    setIsSubmitting(true);
    
    try {
      await insertPledge({
        phone: name, // Using name as phone for simplicity in this example
        county: county,
        amount: 1.00,
        payment_method: 'manual',
        verified: true
      });
      setOpen(false);
      setName('');
      setCounty('');
    } catch (error) {
      console.error('Failed to add pledge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="gold" size="lg" className="mt-8">
          Add Your Pledge
        </Button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-primary-black rounded-2xl p-6 shadow-lg border border-white/10">
          <Dialog.Title className="text-2xl font-bold text-white mb-4">
            Join the WANTAM Pledge
          </Dialog.Title>
          
          <Dialog.Description className="text-white/70 mb-6">
            Add your name to the wall of Kenyans demanding accountability and one-term limits for corruption.
          </Dialog.Description>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-white mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white"
                placeholder="Enter your name"
                required
                aria-label="Enter your name"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="county" className="block text-white mb-2">
                Your County
              </label>
              <select
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white"
                required
                aria-label="Select your county"
              >
                <option value="">Select your county</option>
                {counties.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-4">
              <Dialog.Close asChild>
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Dialog.Close>
              
              <Button 
                variant="gold" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Add My Pledge'}
              </Button>
            </div>
          </form>
          
          <Dialog.Close asChild>
            <button 
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
