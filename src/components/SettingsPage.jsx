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
    hydrogenPortScanStart: 6969,
    hydrogenPortScanEnd: 7069
  });
  
  const [isElectron, setIsElectron] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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
  
  const saveSettings = async () => {
    if (!isElectron) return;
    
    try {
      const result = await window.electron.invoke('save-settings', settings);
      if (result.success) {
        window.dispatchEvent(new CustomEvent('settings-changed', {
          detail: { settings }
        }));
        
        if (!settings.autoSave) {
          setTimeout(() => {
            if (onSaveTabsManually) onSaveTabsManually();
          }, 300);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  useEffect(() => {
    if (isElectron && Object.keys(settings).length > 0) {
      const timer = setTimeout(() => {
        saveSettings();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [settings]);
  
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

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Configure your preferences for Nocturnal UI</p>
        
        <div className="settings-section">
          <h2 className="settings-section-title">Editor</h2>
          
          <div className="settings-row">
            <label className="settings-label">Font Size</label>
            <input 
              type="number" 
              className="settings-input" 
              value={settings.fontSize} 
              onChange={(e) => handleNumberChange('fontSize', e.target.value)}
              min={8}
              max={32}
            />
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
            <label className="settings-label">Minimap</label>
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
            <label className="settings-label">Line Numbers</label>
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
          <h2 className="settings-section-title">Application</h2>
          
          <div className="settings-row">
            <label className="settings-label">Auto Save</label>
            <div className="settings-info">
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
              <p className="settings-description">
                {settings.autoSave 
                  ? "Changes are saved automatically" 
                  : "Use Cmd+S to save changes"}
              </p>
            </div>
          </div>
          
          <div className="settings-row">
            <label className="settings-label">Hydrogen Port Range</label>
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
        </div>
        
        <div className="settings-actions">
          {!isElectron && (
            <div className="browser-mode-message">
              Nocturnal UI is designed to run as a desktop application
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
