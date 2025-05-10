import React, { useState } from 'react';

export default function HomePage() {
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  
  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount === 5) {
      setShowEasterEgg(true);
      setTimeout(() => {
        setClickCount(0);
        setShowEasterEgg(false);
      }, 5000);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 
          className="welcome-title" 
          onClick={handleTitleClick}
          style={{ cursor: 'pointer' }}
        >
          Welcome to Nocturnal UI
        </h1>
        
        {showEasterEgg && (
          <div className="easter-egg-message mt-2 mb-4 text-center text-white animate-pulse">
             copy this and paste it in a discord channel!: i-love-nocturnal9921
          </div>
        )}
        
        <p className="welcome-subtitle">
          A minimalist scripting interface for Hydrogen
        </p>
        
        <div className="version-info-box">
          <div className="version">v1.0.1-alpha.1</div>
          <div className="build-date">May 6, 2025</div>
        </div>
        
        <div className="changelog-box">
          <h2 className="changelog-title">Recent Updates</h2>
          <ul className="changelog-list">
          <li>
              <div className="changelog-version">1.0.1-beta.1</div>
              <div className="changelog-text">Added Local Script Library</div>
            </li>
          <li>
              <div className="changelog-version">1.0.1-alpha.1</div>
              <div className="changelog-text">Added Discord RPC, Auto execute and more</div>
            </li>
          <li>
              <div className="changelog-version">1.0.0-beta.1</div>
              <div className="changelog-text">Join our discord server!</div>
            </li>
            <li>
              <div className="changelog-version">1.0.0-alpha.1</div>
              <div className="changelog-text">Initial release :3</div>
            </li>
          </ul>
        </div>
        
        <div className="action-hint">
          <p>Click on "Editor" in the sidebar to get started!</p>
        </div>
      </div>
    </div>
  );
}
