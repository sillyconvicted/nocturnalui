import React, { useState, useEffect } from 'react';

const globalSearchState = {
  term: '',
  results: [],
  hasSearched: false,
  activeScriptId: null,
  page: 1,
  useRScripts: true,
};

export default function ScriptHub({ onSelectScript }) {
  const [searchTerm, setSearchTerm] = useState(globalSearchState.term);
  const [searchResults, setSearchResults] = useState(globalSearchState.results);
  const [hasSearched, setHasSearched] = useState(globalSearchState.hasSearched);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(globalSearchState.page || 1);
  const [maxPages, setMaxPages] = useState(1);
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
    globalSearchState.page = currentPage;
  }, [searchTerm, searchResults, hasSearched, activeScript, currentPage]);
  
  const fetchScriptsFromRScripts = async (query, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `https://rscripts.net/api/v2/scripts?page=${page}&orderBy=date&sort=desc${query ? `&q=${encodeURIComponent(query)}` : ''}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.scripts) {
        setSearchResults(data.scripts);
        if (data.info) {
          setCurrentPage(data.info.currentPage);
          setMaxPages(data.info.maxPages);
        }
      } else {
        setSearchResults([]);
        setMaxPages(1);
      }
      
      setHasSearched(true);
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
      fetchScriptsFromRScripts(searchTerm, 1);
    } else {
      fetchScriptsFromRScripts('', 1);
    }
  };
  
  const handleScriptSelect = async (script) => {
    setActiveScript(script);
    globalSearchState.activeScriptId = script._id;
    
    try {
      setLoading(true);
      if (script.rawScript) {
        const scriptResponse = await fetch(script.rawScript);
        if (!scriptResponse.ok) {
          throw new Error(`${scriptResponse.status}`);
        }
        
        const scriptContent = await scriptResponse.text();
        
        if (onSelectScript) {
          onSelectScript(script.title, scriptContent);
        }
      } else {
        throw new Error("This script doesn't have raw content available");
      }
    } catch (err) {
      setError(` ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= maxPages) {
      setCurrentPage(newPage);
      fetchScriptsFromRScripts(searchTerm, newPage);
    }
  };
  
  useEffect(() => {
    if (searchResults.length === 0 && !hasSearched && !loading) {
      fetchScriptsFromRScripts('', 1);
    }
  }, []);
  
  return (
    <div className="scripthub-container">
      <div className="scripthub-header">
        <h1 className="scripthub-title">Script Hub</h1>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search games or scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>
      
      <div className="scripts-list">
        {loading && searchResults.length === 0 ? (
          <div className="loading-indicator">Loading scripts...</div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="pagination-info">
              Page {currentPage} of {maxPages}
            </div>
            
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
                      {script.user?.verified && (
                        <span className="verified-tag" title="Verified creator">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {script.game && (
                    <div className="script-meta">
                      <span className="script-game">{script.game.title || 'Unknown Game'}</span>
                    </div>
                  )}
                  
                  <div className="script-stats">
                    <span className="script-views">{script.views} views</span>
                  </div>
                  
                  <div className="script-user">
                    By: {script.user?.username || 'Unknown'}
                  </div>
                  
                  <div className="script-action-row">
                    <div className="script-tags">
                      {script.keySystem && (
                        <span className="script-key-system">Key System</span>
                      )}
                      {script.mobileReady && (
                        <span className="script-mobile">Mobile</span>
                      )}
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
                </div>
              ))}
            </div>
            
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {currentPage} of {maxPages}
              </span>
              <button 
                className="pagination-btn"
                disabled={currentPage >= maxPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            {hasSearched 
              ? searchTerm 
                ? 'No scripts found. Try a different search term.' 
                : 'No scripts available.'
              : 'Loading scripts...'}
          </div>
        )}
      </div>
    </div>
  );
}
