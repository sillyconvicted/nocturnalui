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
    hydrogenPortScanEnd: 7069,
    pinkTheme: false,
    autoExecUltraguard: false,
    autoExecNocturnalUI: false
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
  
  const handleOpenAutoExecuteFolder = async () => {
    if (!isElectron) return;
    
    try {
      await window.electron.invoke('open-autoexec-folder');
    } catch (error) {
      console.error('Failed to open auto-execute folder:', error);
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

  useEffect(() => {
    const handleDocsSearch = (event) => {
      if (event.detail && event.detail.query) {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'docs' } }));
        window.dispatchEvent(new CustomEvent('docs-search', { detail: { query: event.detail.query } }));
      }
    };
    
    window.addEventListener('docs-search', handleDocsSearch);
    return () => window.removeEventListener('docs-search', handleDocsSearch);
  }, []);

  const toggleAutoExecScript = async (scriptKey) => {
    if (!isElectron) return;
    
    try {
      const newState = !settings[scriptKey === 'ultraguard' ? 'autoExecUltraguard' : 'autoExecNocturnalUI'];
      handleChange(
        scriptKey === 'ultraguard' ? 'autoExecUltraguard' : 'autoExecNocturnalUI', 
        newState
      );
      
      await window.electron.invoke('toggle-autoexec', {
        script: scriptKey,
        enabled: newState
      });
    } catch (error) {
      console.error(error);

      handleChange(
        scriptKey === 'ultraguard' ? 'autoExecUltraguard' : 'autoExecNocturnalUI',
        !newState
      );
    }
  };

  return (
    <div className="flex-1 bg-[#0e0e0e] overflow-y-auto py-6">
      <div className="max-w-3xl w-full mx-auto px-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-semibold font-display">Settings</h1>
          {renderSaveStatus()}
        </div>
        <p className="text-sm text-gray-400 mb-8">Customize Nocturnal UI to match your workflow</p>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 pb-2 border-b border-white/20">Editor Preferences</h2>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Font Size</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className="w-20 text-right bg-[#131313] border border-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600"
                  value={settings.fontSize} 
                  onChange={(e) => handleNumberChange('fontSize', e.target.value)}
                  min={8}
                  max={32}
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Tab Size</label>
              <select 
                className="w-32 bg-[#131313] border border-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600 appearance-none"
                value={settings.tabSize}
                onChange={(e) => handleNumberChange('tabSize', e.target.value)}
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Word Wrap</label>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="word-wrap" 
                  className="sr-only"
                  checked={settings.wordWrap}
                  onChange={(e) => handleChange('wordWrap', e.target.checked)}
                />
                <label 
                  htmlFor="word-wrap" 
                  className={`absolute inset-0 rounded flex items-center justify-center border ${settings.wordWrap ? 'bg-[#252525] border-[#333333]' : 'bg-[#1a1a1a] border-[#222222]'} cursor-pointer`}
                >
                  {settings.wordWrap && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Show Minimap</label>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="minimap" 
                  className="sr-only"
                  checked={settings.minimap}
                  onChange={(e) => handleChange('minimap', e.target.checked)}
                />
                <label 
                  htmlFor="minimap" 
                  className={`absolute inset-0 rounded flex items-center justify-center border ${settings.minimap ? 'bg-[#252525] border-[#333333]' : 'bg-[#1a1a1a] border-[#222222]'} cursor-pointer`}
                >
                  {settings.minimap && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Show Line Numbers</label>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="line-numbers" 
                  className="sr-only"
                  checked={settings.lineNumbers}
                  onChange={(e) => handleChange('lineNumbers', e.target.checked)}
                />
                <label 
                  htmlFor="line-numbers" 
                  className={`absolute inset-0 rounded flex items-center justify-center border ${settings.lineNumbers ? 'bg-[#252525] border-[#333333]' : 'bg-[#1a1a1a] border-[#222222]'} cursor-pointer`}
                >
                  {settings.lineNumbers && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 pb-2 border-b border-white/20">Application Settings</h2>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">Auto Save Scripts</label>
                <p className="text-xs text-gray-500 mt-1">
                  {settings.autoSave ? "Changes are saved automatically" : "Use Cmd+S (or Ctrl+S) to save changes"}
                </p>
              </div>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="auto-save" 
                  className="sr-only"
                  checked={settings.autoSave}
                  onChange={(e) => handleChange('autoSave', e.target.checked)}
                />
                <label 
                  htmlFor="auto-save" 
                  className={`absolute inset-0 rounded flex items-center justify-center border ${settings.autoSave ? 'bg-[#252525] border-[#333333]' : 'bg-[#1a1a1a] border-[#222222]'} cursor-pointer`}
                >
                  {settings.autoSave && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">Hydrogen Port Range</label>
                <p className="text-xs text-gray-500 mt-1">
                  Range of ports to scan for Hydrogen server
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className="w-20 text-center bg-[#131313] border border-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600"
                  value={settings.hydrogenPortScanStart} 
                  onChange={(e) => handleNumberChange('hydrogenPortScanStart', e.target.value)}
                  min={1000}
                  max={65535}
                />
                <span className="text-xs text-gray-500">to</span>
                <input 
                  type="number" 
                  className="w-20 text-center bg-[#131313] border border-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600"
                  value={settings.hydrogenPortScanEnd} 
                  onChange={(e) => handleNumberChange('hydrogenPortScanEnd', e.target.value)}
                  min={1000}
                  max={65535}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">macOS Window Controls</label>
                <p className="text-xs text-gray-500 mt-1">
                  cant get this to work smh
                </p>
              </div>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="macos-buttons" 
                  className="sr-only"
                  disabled={true}
                  checked={settings.macosButtons}
                  onChange={(e) => handleChange('macosButtons', e.target.checked)}
                />
                <label 
                  htmlFor="macos-buttons" 
                  className={`absolute inset-0 rounded flex items-center justify-center border opacity-50 ${settings.macosButtons ? 'bg-[#252525] border-[#333333]' : 'bg-[#1a1a1a] border-[#222222]'} cursor-not-allowed`}
                >
                  {settings.macosButtons && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">Beta Pink Theme</label>
                <p className="text-xs text-gray-500 mt-1">
                  Enables a pink-hued theme for the UI (Beta feature)
                </p>
              </div>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="pink-theme" 
                  className="sr-only"
                  checked={settings.pinkTheme}
                  onChange={(e) => handleChange('pinkTheme', e.target.checked)}
                />
                <label 
                  htmlFor="pink-theme" 
                  className={`absolute inset-0 rounded flex items-center justify-center border ${settings.pinkTheme ? 'bg-[#38144b] border-[#ff46c5]' : 'bg-[#1a1a1a] border-[#222222]'} cursor-pointer`}
                >
                  {settings.pinkTheme && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 pb-2 border-b border-white/20">Experimental</h2>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">ULTRAGUARD+</label>
                <p className="text-xs text-gray-500 mt-1">
                UltraSigmaGuard+, provides extensive protection against malicious behavior in Lua scripts executed via Roblox exploit environments.
                </p>
              </div>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="auto-exec-ultraguard" 
                  className="sr-only"
                  checked={settings.autoExecUltraguard}
                  onChange={() => toggleAutoExecScript('ultraguard')}
                />
                <label 
                  htmlFor="auto-exec-ultraguard" 
                  className={`absolute inset-0 rounded flex items-center justify-center border ${
                    settings.autoExecUltraguard ? 'bg-[#252525] border-[#333333]' : 'bg-[#1a1a1a] border-[#222222]'
                  } cursor-pointer`}
                >
                  {settings.autoExecUltraguard && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">Nocturnal Internal UI</label>
                <p className="text-xs text-gray-500 mt-1">
                  The internal version of the coolest UI in the world.
                </p>
              </div>
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  id="auto-exec-nocturnal" 
                  className="sr-only"
                  checked={settings.autoExecNocturnalUI}
                  onChange={() => toggleAutoExecScript('nocturnal')}
                />
                <label 
                  htmlFor="auto-exec-nocturnal" 
                  className={`absolute inset-0 rounded flex items-center justify-center border ${
                    settings.autoExecNocturnalUI ? 'bg-[#252525] border-[#333333]' : 'bg-[#1a1a1a] border-[#222222]'
                  } cursor-pointer`}
                >
                  {settings.autoExecNocturnalUI && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
