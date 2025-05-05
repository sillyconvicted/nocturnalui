"use client";

import React, { useState, useEffect, useRef } from "react";

export default function ConsolePage() {
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const logContainerRef = useRef(null);
  const scrollPositionRef = useRef(null);
  const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

  const fetchLogs = async (preserveScroll = false) => {
    if (!isElectron) {
      setError("get out!");
      setLoading(false);
      return;
    }

    try {

      if (preserveScroll && logContainerRef.current) {
        scrollPositionRef.current = {
          top: logContainerRef.current.scrollTop,
          height: logContainerRef.current.scrollHeight
        };
      }
      
      setLoading(true);
      const result = await window.electron.invoke('read-roblox-logs');
      
      if (result.success) {
        setLogEntries(result.entries || []);
        setLastRefreshTime(new Date());
        
        if (result.filteredCount !== undefined) {
          setFilteredCount(result.filteredCount);
        }
      } else {
        setError(result.error || "i couldn't to read logs");
      }
    } catch (err) {
      setError(err.message || "An error occurred!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && logContainerRef.current) {
      if (scrollPositionRef.current) {
        const newPosition = scrollPositionRef.current.top + 
                           (logContainerRef.current.scrollHeight - scrollPositionRef.current.height);
        
        if (Math.abs(logContainerRef.current.scrollHeight - scrollPositionRef.current.height) > 10) {
          logContainerRef.current.scrollTop = newPosition;
        }
        
        scrollPositionRef.current = null;
      } else {
        logContainerRef.current.scrollTop = 0;
      }
    }
  }, [logEntries, loading]);

  useEffect(() => {
    fetchLogs();
    
    let refreshInterval;
    if (autoRefresh) {
      refreshInterval = setInterval(() => fetchLogs(true), 5000);
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  const formatLogTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };

  const getLogTypeClass = (entry) => {
    if (!entry) return '';
    
    if (entry.toLowerCase().includes('error') || 
        entry.includes('Exception') || 
        entry.includes('failed')) {
      return 'console-error';
    }
    
    if (entry.toLowerCase().includes('warn') || 
        entry.toLowerCase().includes('caution') || 
        entry.includes('⚠️')) {
      return 'console-warning';
    }
    
    return '';
  };
  
  const shouldShowEntry = (entry) => {
    if (!entry || !entry.text) return false;
    
    const text = entry.text.toLowerCase();
    
    if (text.includes('clientruninfo') || 
        text.includes('updatecontroller') ||
        text.includes('appdelegate') ||
        text.includes('settingsurl')) {
      return false;
    }
    
    return true;
  };

  const displayedEntries = logEntries.filter(shouldShowEntry);
  
  return (
    <div className="log-viewer-container">
      <div className="log-viewer-header">
        <h2 className="log-viewer-title">Roblox Logs</h2>
        <div className="log-viewer-actions">
          <div className="auto-refresh-toggle">
          </div>
          <button 
            className="refresh-button"
            onClick={() => fetchLogs(true)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {lastRefreshTime && (
        <div className="last-refresh">
          Last updated: {lastRefreshTime.toLocaleTimeString()} 
          {filteredCount > 0 && ` • ${filteredCount} entries filtered`}
        </div>
      )}
      
      {loading && displayedEntries.length === 0 ? (
        <div className="log-viewer-loading">Loading logs...</div>
      ) : error ? (
        <div className="log-viewer-error">{error}</div>
      ) : displayedEntries.length === 0 ? (
        <div className="log-viewer-empty">No log entries found</div>
      ) : (
        <div className="log-viewer-output" ref={logContainerRef}>
          {displayedEntries.map((entry, index) => (
            <div key={index} className={`log-entry ${getLogTypeClass(entry.text)}`}>
              <span className="log-timestamp">{formatLogTimestamp(entry.timestamp)}</span>
              <span className="log-message">{entry.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
