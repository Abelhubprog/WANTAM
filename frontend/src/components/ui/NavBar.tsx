import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './button';

/**
 * Navigation bar component for the application
 */
export default function NavBar() {
  return (
    <nav className="bg-primary-black/90 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-white flex items-center">
          <span className="text-kenyan-red">WANTAM</span>
          <span className="text-white">.ink</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-white/80 hover:text-white hidden md:inline-block">
            Home
          </Link>
          <Link to="/pledge" className="text-white/80 hover:text-white hidden md:inline-block">
            Pledge Wall
          </Link>
          
          <Link to="/pledge">
            <Button variant="gold" size="sm">
              Join the Pledge
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
