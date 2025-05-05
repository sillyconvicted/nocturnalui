"use client";

import React, { useState, useEffect } from 'react';

export default function TitleBar({ isSaving }) {
  const [electronAvailable, setElectronAvailable] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ 
    connected: false, 
    checking: true 
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [macosButtons, setMacosButtons] = useState(true); 

  useEffect(() => {
    setElectronAvailable(typeof window !== 'undefined' && window.electron !== undefined);

    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.electron) {
        try {
          const result = await window.electron.invoke('check-hydrogen');
          setConnectionStatus({ 
            connected: result.connected, 
            checking: false 
          });
        } catch (error) {
          console.error(error);
          setConnectionStatus({ connected: false, checking: false });
        }
      } else {
        setConnectionStatus({ connected: false, checking: false, browserMode: true });
      }
    };
    
    checkConnection();
    
    const interval = setInterval(checkConnection, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadAutoSaveSetting = async () => {
      if (typeof window.electron !== 'undefined') {
        try {
          const result = await window.electron.invoke('load-settings');
          if (result.success) {
            setAutoSaveEnabled(result.data.autoSave !== undefined ? result.data.autoSave : true);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    loadAutoSaveSetting();

    const handleSettingsChanged = (event) => {
      if (event.detail && event.detail.settings) {
        setAutoSaveEnabled(event.detail.settings.autoSave);
        if (event.detail.settings.autoSave) {
          setHasUnsavedChanges(false);
        }
      }
    };
    
    window.addEventListener('settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (typeof window.electron !== 'undefined') {
        try {
          const result = await window.electron.invoke('load-settings');
          if (result.success) {
            setAutoSaveEnabled(result.data.autoSave !== undefined ? result.data.autoSave : true);
            setMacosButtons(result.data.macosButtons !== undefined ? result.data.macosButtons : false);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    loadSettings();
    
    const handleSettingsChanged = (event) => {
      if (event.detail && event.detail.settings) {
        setAutoSaveEnabled(event.detail.settings.autoSave);
        setMacosButtons(event.detail.settings.macosButtons);
        if (event.detail.settings.autoSave) {
          setHasUnsavedChanges(false);
        }
      }
    };
    
    window.addEventListener('settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    const handleCodeChanged = () => {
      if (!autoSaveEnabled) {
        setHasUnsavedChanges(true);
      }
    };

    const handleSaved = () => {
      setHasUnsavedChanges(false);
    };
    
    window.addEventListener('code-changed', handleCodeChanged);
    window.addEventListener('tabs-saved', handleSaved);
    
    return () => {
      window.removeEventListener('code-changed', handleCodeChanged);
      window.removeEventListener('tabs-saved', handleSaved);
    };
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (isSaving) {
      setHasUnsavedChanges(false);
    }
  }, [isSaving]);

  const handleMinimize = () => {
    if (electronAvailable) {
      window.electron.send('window-minimize');
    }
  };

  const handleMaximize = () => {
    if (electronAvailable) {
      window.electron.send('window-maximize');
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (electronAvailable) {
      window.electron.send('window-close');
    }
  };

  return (
    <div className="title-bar">
      <div className="app-title-container">
        {electronAvailable && macosButtons && (
          <div className="window-controls macos-style">
            <button className="window-control macos close" onClick={handleClose} title="Close">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M6 5l4-4 1 1-4 4 4 4-1 1-4-4-4 4-1-1 4-4-4-4 1-1 4 4z" fill="currentColor" />
              </svg>
            </button>
            <button className="window-control macos minimize" onClick={handleMinimize} title="Minimize">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 6h8v1H2z" fill="currentColor" />
              </svg>
            </button>
            <button className="window-control macos maximize" onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M3 3v6h6V3H3zm1 1h4v4H4V4z" fill="currentColor" />
              </svg>
            </button>
          </div>
        )}

        <span className="app-title">Nocturnal UI</span>
        
        {electronAvailable && (
          <>
            <span className="title-separator">|</span>
            <div className="connection-status">
              {connectionStatus.checking ? (
                <span className="connection-checking">Not connected</span>
              ) : connectionStatus.connected ? (
                <span className="connection-connected">Connected</span>
              ) : (
                <span className="connection-disconnected">Not connected</span>
              )}
            </div>
          </>
        )}
      </div>

      {electronAvailable && !macosButtons && (
        <div className="window-controls windows-style">
          <button className="window-control" onClick={handleMinimize} title="Minimize">
            <svg width="10" height="10" viewBox="0 0 10 1">
              <path d="M0 0h10v1H0z" fill="currentColor" />
            </svg>
          </button>
          <button className="window-control" onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M2 0v2H0v8h8V8h2V0H2zm5 9H1V3h6v6z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button className="window-control close" onClick={handleClose} title="Close">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 1l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
