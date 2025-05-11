import React, { useState, useEffect } from 'react';

const globalSearchState = {
  term: '',
  results: [],
  hasSearched: false,
  activeScriptId: null,
  page: 1,
  useRScripts: true,
  localLibrary: [],
  activeLibrary: 'rscripts',
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
  const [activeLibrary, setActiveLibrary] = useState(globalSearchState.activeLibrary);
  const [localLibrary, setLocalLibrary] = useState(globalSearchState.localLibrary);
  const [localSearchResults, setLocalSearchResults] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  
  useEffect(() => {
    globalSearchState.term = searchTerm;
    globalSearchState.results = searchResults;
    globalSearchState.hasSearched = hasSearched;
    globalSearchState.activeScriptId = activeScript?._id;
    globalSearchState.page = currentPage;
    globalSearchState.activeLibrary = activeLibrary;
    globalSearchState.localLibrary = localLibrary;
  }, [searchTerm, searchResults, hasSearched, activeScript, currentPage, activeLibrary, localLibrary]);
  
  useEffect(() => {
    const loadLocalLibrary = async () => {
      if (typeof window.electron !== 'undefined') {
        setLocalLoading(true);
        
        try {

          const preloadedScriptsJson = sessionStorage.getItem('preloadedLocalScripts');
          if (preloadedScriptsJson) {
            const preloadedScripts = JSON.parse(preloadedScriptsJson);
            setLocalLibrary(preloadedScripts);
            setLocalSearchResults(preloadedScripts);
            setLocalLoading(false);
            
            sessionStorage.removeItem('preloadedLocalScripts');
            return;
          }
      
          const result = await window.electron.invoke('load-local-scripts');
          if (result.success) {
            setLocalLibrary(result.scripts || []);
            globalSearchState.localLibrary = result.scripts || [];
          }
        } catch (error) {
          console.error(error);
          setLocalLibrary([]);
        } finally {
          setLocalLoading(false);
        }
      } else {
        try {
          const savedLibrary = localStorage.getItem('nocturnal-local-scripts');
          if (savedLibrary) {
            const parsedLibrary = JSON.parse(savedLibrary);
            setLocalLibrary(parsedLibrary || []);
            globalSearchState.localLibrary = parsedLibrary || [];
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    
    loadLocalLibrary();
  }, []);
  
  useEffect(() => {
    if (activeLibrary === 'local') {
      if (!searchTerm.trim()) {
        setLocalSearchResults(localLibrary);
      } else {
        const filtered = localLibrary.filter(script => 
          script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (script.game && script.game.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setLocalSearchResults(filtered);
      }
    }
  }, [searchTerm, localLibrary, activeLibrary]);

  useEffect(() => {
    const needsRScriptsPreload = sessionStorage.getItem('needsRScriptsPreload') === 'true';
    
    if (needsRScriptsPreload && typeof window.electron !== 'undefined') {
      const preloadRScripts = async () => {
        try {
          const controller = new AbortController();
          const signal = controller.signal;
          
          const apiUrl = 'https://rscripts.net/api/v2/scripts?page=1&orderBy=popular&sort=desc';
          const response = await fetch(apiUrl, { signal });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data && data.scripts) {
              setSearchResults(data.scripts);
              globalSearchState.results = data.scripts;
              
              sessionStorage.setItem('preloadedRScripts', JSON.stringify({
                scripts: data.scripts,
                info: data.info || {},
                timestamp: Date.now()
              }));

              sessionStorage.removeItem('needsRScriptsPreload');
            }
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn(err);
          }
        }
      };

      const timeoutId = setTimeout(preloadRScripts, 2000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, []);

  const fetchScriptsFromRScripts = async (query, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      if (page === 1 && !query) {
        const preloadedData = sessionStorage.getItem('preloadedRScripts');
        
        if (preloadedData) {
          const data = JSON.parse(preloadedData);

          if (Date.now() - data.timestamp < 600000) {
            setSearchResults(data.scripts);
            if (data.info) {
              setCurrentPage(data.info.currentPage || 1);
              setMaxPages(data.info.maxPages || 1);
            }
            setHasSearched(true);
            setLoading(false);
            return;
          }
        }
      }

      const apiUrl = `https://rscripts.net/api/v2/scripts?page=${page}&orderBy=${query ? 'date' : 'popular'}&sort=desc${query ? `&q=${encodeURIComponent(query)}` : ''}`;
      
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
    
    if (activeLibrary === 'rscripts') {
      if (searchTerm.trim()) {
        fetchScriptsFromRScripts(searchTerm, 1);
      } else {
        fetchScriptsFromRScripts('', 1);
      }
    } else {
      if (!searchTerm.trim()) {
        setLocalSearchResults(localLibrary);
      } else {
        const filtered = localLibrary.filter(script => 
          script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (script.game && script.game.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setLocalSearchResults(filtered);
      }
      setHasSearched(true);
    }
  };
  
  const handleRScriptSelect = async (script) => {
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
  
  const handleLocalScriptSelect = (script) => {
    if (onSelectScript) {
      onSelectScript(script.title, script.code);
    }
  };
  
  const handleDeleteLocalScript = async (scriptId) => {
    if (window.confirm("Are you sure you want to delete this script from your local library?")) {
      const updatedLibrary = localLibrary.filter(script => script.id !== scriptId);
      setLocalLibrary(updatedLibrary);
      setLocalSearchResults(
        localSearchResults.filter(script => script.id !== scriptId)
      );
      
      if (typeof window.electron !== 'undefined') {
        try {
          await window.electron.invoke('save-local-scripts', updatedLibrary);
        } catch (error) {
          console.error(error);
        }
      } else {
      }
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= maxPages) {
      setCurrentPage(newPage);
      fetchScriptsFromRScripts(searchTerm, newPage);
    }
  };
  
  const handleLibraryChange = (library) => {
    setActiveLibrary(library);
    globalSearchState.activeLibrary = library;
    
    if (library === 'local') {
      setLocalSearchResults(localLibrary);
      setHasSearched(true);
    } else {
      if (searchResults.length === 0 && !hasSearched) {
        fetchScriptsFromRScripts('', 1);
      }
    }
  };
  
  useEffect(() => {
    if (activeLibrary === 'rscripts' && searchResults.length === 0 && !hasSearched && !loading) {
      fetchScriptsFromRScripts('', 1);
    } else if (activeLibrary === 'local' && localSearchResults.length === 0) {
      setLocalSearchResults(localLibrary);
    }
  }, [activeLibrary]);
  
  return (
    <div className="scripthub-container">
      <div className="scripthub-header">
        <h1 className="scripthub-title">Script Library</h1>
        
        <div className="library-tabs">
          <button 
            className={`library-tab ${activeLibrary === 'rscripts' ? 'active' : ''}`}
            onClick={() => handleLibraryChange('rscripts')}
          >
            RScripts
          </button>
          <button 
            className={`library-tab ${activeLibrary === 'local' ? 'active' : ''}`}
            onClick={() => handleLibraryChange('local')}
          >
            Local Library
          </button>
        </div>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder={activeLibrary === 'rscripts' ? "Search games or scripts..." : "Search your local scripts..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>
      
      <div className="scripts-list">
        {loading && (activeLibrary === 'rscripts' ? searchResults.length === 0 : localSearchResults.length === 0) ? (
          <div className="loading-indicator">Loading scripts...</div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : activeLibrary === 'rscripts' && searchResults.length > 0 ? (
          <>
            <div className="pagination-info">
              Page {currentPage} of {maxPages}
            </div>
            
            <div className="scripts-grid">
              {searchResults.map((script) => (
                <div 
                  key={script._id} 
                  className={`script-card ${activeScript?._id === script._id ? 'active' : ''}`}
                  onClick={() => handleRScriptSelect(script)}
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
                        handleRScriptSelect(script);
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
        ) : activeLibrary === 'local' && localSearchResults.length > 0 ? (
          <div className="scripts-grid">
            {localSearchResults.map((script) => (
              <div 
                key={script.id} 
                className="script-card local-script-card"
                onClick={() => handleLocalScriptSelect(script)}
              >
                <div className="script-card-header">
                  <div className="script-title-wrapper">
                    <h3 className="script-title">{script.title}</h3>
                  </div>
                </div>
                
                {script.game && (
                  <div className="script-meta">
                    <span className="script-game">{script.game}</span>
                  </div>
                )}
                
                <div className="script-stats">
                  <span className="script-date">Saved: {new Date(script.dateSaved).toLocaleDateString()}</span>
                </div>
                
                <div className="script-action-row">
                  <button 
                    className="script-use-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLocalScriptSelect(script);
                    }}
                  >
                    Use Script
                  </button>
                  
                  <button 
                    className="script-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocalScript(script.id);
                    }}
                    title="Delete from library"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {hasSearched 
              ? searchTerm 
                ? 'No scripts found. Try a different search term.' 
                : activeLibrary === 'local' 
                  ? 'Your local library is empty. Save scripts from tabs to add them here.' 
                  : 'No scripts available.'
              : 'Loading scripts...'}
          </div>
        )}
      </div>
    </div>
  );
}
