import React, { useState, useEffect } from 'react';
const globalSearchState = {
  term: '',
  results: [],
  hasSearched: false,
  activeScriptId: null
};

export default function ScriptHub({ onSelectScript }) {
  const [searchTerm, setSearchTerm] = useState(globalSearchState.term);
  const [searchResults, setSearchResults] = useState(globalSearchState.results);
  const [hasSearched, setHasSearched] = useState(globalSearchState.hasSearched);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeScript, setActiveScript] = useState(
    globalSearchState.activeScriptId ? 
      searchResults.find(s => s._id === globalSearchState.activeScriptId) : 
      null
  );
  
  useEffect(() => {
    globalSearchState.term = searchTerm;
    globalSearchState.results = searchResults;
    globalSearchState.hasSearched = hasSearched;
    globalSearchState.activeScriptId = activeScript?._id;
  }, [searchTerm, searchResults, hasSearched, activeScript]);
  
  const fetchScripts = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      const availableScripts = data.result.scripts.filter(script => 
        script.script && script.script.trim() !== ''
      );
      
      setSearchResults(availableScripts || []);
      globalSearchState.results = availableScripts || [];
      setHasSearched(true);
      globalSearchState.hasSearched = true;
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchScripts(searchTerm);
    }
  };
  
  const handleScriptSelect = (script) => {
    setActiveScript(script);
    globalSearchState.activeScriptId = script._id;
    if (onSelectScript) {
      onSelectScript(script.title, script.script);
    }
  };
  
  useEffect(() => {
    if (globalSearchState.results.length > 0 && searchResults.length === 0) {
      setSearchResults(globalSearchState.results);
    }
  }, [searchResults]);
  
  return (
    <div className="scripthub-container">
      <div className="scripthub-header">
        <h1 className="scripthub-title">Script Hub</h1>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>
      
      <div className="scripts-list">
        {loading ? (
          <div className="loading-indicator">Loading scripts...</div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : searchResults.length > 0 ? (
          <div className="scripts-grid">
            {searchResults.map((script) => (
              <div 
                key={script._id} 
                className={`script-card ${activeScript?._id === script._id ? 'active' : ''}`}
                onClick={() => handleScriptSelect(script)}
              >
                <div className="script-card-header">
                  <div className="script-title-wrapper">
                    <h3 className="script-title">{script.title}</h3>
                    {script.verified && (
                      <span className="verified-tag" title="Verified script">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="script-meta">
                  <span className="script-game">{script.game?.name || 'Unknown Game'}</span>
                </div>
                
                <div className="script-stats">
                  <span className="script-views">{script.views} views</span>
                  {script.isPatched && <span className="script-patched">Patched</span>}
                </div>
                
                <button 
                  className="script-use-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScriptSelect(script);
                  }}
                >
                  Use Script
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {hasSearched 
              ? searchTerm 
                ? 'No scripts found. Try a different search term.' 
                : 'Please enter a search term.'
              : 'Search for scripts to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}
