"use client";

import React, { useState, useEffect, useRef } from "react";

export default function ConsolePage() {
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const logContainerRef = useRef(null);
  const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

  const fetchLogs = async () => {
    if (!isElectron) {
      setError("why are you here");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await window.electron.invoke('read-roblox-logs');
      
      if (result.success) {
        setLogEntries(result.entries || []);
        setLastRefreshTime(new Date());
      } else {
        setError(result.error || "Failed to read logs");
      }
    } catch (err) {
      setError(err.message || "An error occurred!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    let refreshInterval;
    if (autoRefresh) {
      refreshInterval = setInterval(fetchLogs, 5000);
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries]);

  const formatLogTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };

  const getLogTypeClass = (entry) => {
    if (entry.includes('Error') || entry.includes('error')) return 'console-error';
    if (entry.includes('Warn') || entry.includes('warn')) return 'console-warning';
    return '';
  };
  
  return (
    <div className="log-viewer-container">
      <div className="log-viewer-header">
        <h2 className="log-viewer-title">Roblox Logs</h2>
        <div className="log-viewer-actions">
          <div className="auto-refresh-toggle">
            <input 
              type="checkbox" 
              id="auto-refresh" 
              checked={autoRefresh} 
              onChange={() => setAutoRefresh(!autoRefresh)} 
              className="toggle-checkbox"
            />
            <label htmlFor="auto-refresh"></label>
          </div>
          <button 
            className="refresh-button"
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {lastRefreshTime && (
        <div className="last-refresh">
          Last updated: {lastRefreshTime.toLocaleTimeString()}
        </div>
      )}
      
      {loading && logEntries.length === 0 ? (
        <div className="log-viewer-loading">Loading logs...</div>
      ) : error ? (
        <div className="log-viewer-error">{error}</div>
      ) : logEntries.length === 0 ? (
        <div className="log-viewer-empty">No log entries found</div>
      ) : (
        <div className="log-viewer-output" ref={logContainerRef}>
          {logEntries.map((entry, index) => (
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
