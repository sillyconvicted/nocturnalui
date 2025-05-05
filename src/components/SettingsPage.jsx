"use client";

import { useState, useEffect } from "react";

export default function SettingsPage({ onSaveTabsManually }) {
  const [settings, setSettings] = useState({
    theme: "dark",
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: false,
    autoSave: true,
    lineNumbers: true,
    macosButtons: false, 
    hydrogenPortScanStart: 6969,
    hydrogenPortScanEnd: 7069
  });
  
  const [isElectron, setIsElectron] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [settingsChanged, setSettingsChanged] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.electron !== undefined);
    
    const loadSettings = async () => {
      if (typeof window.electron !== 'undefined') {
        try {
          const result = await window.electron.invoke('load-settings');
          if (result.success) {
            setSettings(result.data);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    if (typeof window !== 'undefined' && window.electron) {
      loadSettings();
    }
  }, []);
  
  useEffect(() => {
    setSettingsChanged(true);
    
    if (isElectron && Object.keys(settings).length > 0) {
      const timer = setTimeout(() => {
        saveSettings();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [settings]);
  
  const saveSettings = async () => {
    if (!isElectron) return;
    
    try {
      setSaveStatus("saving");
      const result = await window.electron.invoke('save-settings', settings);
      
      if (result.success) {
        window.dispatchEvent(new CustomEvent('settings-changed', {
          detail: { settings }
        }));
        
        setSaveStatus("saved");
        setSettingsChanged(false);
        
        setTimeout(() => {
          setSaveStatus(null);
        }, 2000);
        
        if (!settings.autoSave) {
          setTimeout(() => {
            if (onSaveTabsManually) onSaveTabsManually();
          }, 300);
        }
      } else {
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!settings.autoSave && onSaveTabsManually) {
          onSaveTabsManually();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.autoSave, onSaveTabsManually]);
  
  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleNumberChange = (key, value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSettings(prev => ({
        ...prev,
        [key]: numValue
      }));
    }
  };
  
  const renderSaveStatus = () => {
    if (!saveStatus) return null;
    
    let statusClass = "";
    let statusText = "";
    
    switch(saveStatus) {
      case "saving":
        statusClass = "saving-indicator";
        statusText = "";
        break;
      case "saved":
        statusClass = "saved-indicator";
        statusText = "";
        break;
      case "error":
        statusClass = "unsaved-indicator";
        statusText = "";
        break;
      default:
        return null;
    }
    
    return <span className={statusClass}>{statusText}</span>;
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
        </div>
        <p className="settings-subtitle">Customize Nocturnal UI to match your workflow</p>
        
        <div className="settings-section">
          <h2 className="settings-section-title">Editor Preferences</h2>
          
          <div className="settings-row">
            <label className="settings-label">Font Size</label>
            <div className="settings-control">
              <input 
                type="number" 
                className="settings-input" 
                value={settings.fontSize} 
                onChange={(e) => handleNumberChange('fontSize', e.target.value)}
                min={8}
                max={32}
              />
              <span className="settings-unit">px</span>
            </div>
          </div>
          
          <div className="settings-row">
            <label className="settings-label">Tab Size</label>
            <select 
              className="settings-select"
              value={settings.tabSize}
              onChange={(e) => handleNumberChange('tabSize', e.target.value)}
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
          
          <div className="settings-row">
            <label className="settings-label">Word Wrap</label>
            <div className="settings-toggle">
              <input 
                type="checkbox" 
                id="word-wrap" 
                className="toggle-checkbox" 
                checked={settings.wordWrap}
                onChange={(e) => handleChange('wordWrap', e.target.checked)}
              />
              <label htmlFor="word-wrap" className="toggle-label"></label>
            </div>
          </div>
          
          <div className="settings-row">
            <label className="settings-label">Show Minimap</label>
            <div className="settings-toggle">
              <input 
                type="checkbox" 
                id="minimap" 
                className="toggle-checkbox" 
                checked={settings.minimap}
                onChange={(e) => handleChange('minimap', e.target.checked)}
              />
              <label htmlFor="minimap" className="toggle-label"></label>
            </div>
          </div>
          
          <div className="settings-row">
            <label className="settings-label">Show Line Numbers</label>
            <div className="settings-toggle">
              <input 
                type="checkbox" 
                id="line-numbers" 
                className="toggle-checkbox" 
                checked={settings.lineNumbers}
                onChange={(e) => handleChange('lineNumbers', e.target.checked)}
              />
              <label htmlFor="line-numbers" className="toggle-label"></label>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="settings-section-title">Application Settings</h2>
          
          <div className="settings-row">
            <div className="settings-label-group">
              <label className="settings-label">Auto Save Scripts</label>
              <p className="settings-description-inline">
                {settings.autoSave ? "Changes are saved automatically" : "Use Cmd+S (or Ctrl+S) to save changes"}
              </p>
            </div>
            <div className="settings-toggle">
              <input 
                type="checkbox" 
                id="auto-save" 
                className="toggle-checkbox" 
                checked={settings.autoSave}
                onChange={(e) => handleChange('autoSave', e.target.checked)}
              />
              <label htmlFor="auto-save" className="toggle-label"></label>
            </div>
          </div>
          
          <div className="settings-row">
            <div className="settings-label-group">
              <label className="settings-label">Hydrogen Port Range</label>
              <p className="settings-description-inline">
                Range of ports to scan for Hydrogen server
              </p>
            </div>
            <div className="port-range-inputs">
              <input 
                type="number" 
                className="settings-input port-input" 
                value={settings.hydrogenPortScanStart} 
                onChange={(e) => handleNumberChange('hydrogenPortScanStart', e.target.value)}
                min={1000}
                max={65535}
              />
              <span className="port-range-separator">to</span>
              <input 
                type="number" 
                className="settings-input port-input" 
                value={settings.hydrogenPortScanEnd} 
                onChange={(e) => handleNumberChange('hydrogenPortScanEnd', e.target.value)}
                min={1000}
                max={65535}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-label-group">
              <label className="settings-label">macOS Window Controls</label>
              <p className="settings-description-inline">
                cant get this to work smh
              </p>
            </div>
            <div className="settings-toggle">
              <input 
                type="checkbox" 
                id="macos-buttons" 
                className="toggle-checkbox"
                disabled={true}
                checked={settings.macosButtons}
                onChange={(e) => handleChange('macosButtons', e.target.checked)}
              />
              <label htmlFor="macos-buttons" className="toggle-label"></label>
            </div>
          </div>
        </div>
        
        <div className="settings-actions">
          {!isElectron && (
            <div className="browser-mode-message">
              why are you here !!!!!!!!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
