import React from 'react';

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="welcome-title">Welcome to Nocturnal UI</h1>
        <p className="welcome-subtitle">
          A minimalist scripting interface for Hydrogen
        </p>
        
        <div className="version-info">
          <span className="version">1.0.0</span>
          <span className="build-date">May 5, 2025</span>
        </div>
        
        <div className="changelog">
          <h2 className="changelog-title">Recent Updates</h2>
          <ul className="changelog-list">
            <li>
              <span className="changelog-version">1.0.0</span>
              <span className="changelog-text">Initial release with</span>
            </li>
          </ul>
        </div>
        
        <div className="action-hint">
          <p>Click on "Scripts" to get started!</p>
        </div>
      </div>
    </div>
  );
}
