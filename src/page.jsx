import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "./components/Sidebar";
import EditorWrapper from "./components/EditorWrapper";
import Tabs from "./components/Tabs";
import HomePage from "./components/HomePage";
import SettingsPage from "./components/SettingsPage";
import TitleBar from "./components/TitleBar";
import ConsolePage from "./components/ConsolePage";
import EditorPreload from "./components/EditorPreload";

const DEFAULT_TAB = { id: 'default', name: 'Script 1', code: 'print("Hello, Hydrogen!")' };

export default function Home() {
  const [scriptTabs, setScriptTabs] = useState([DEFAULT_TAB]);
  const [activeTabId, setActiveTabId] = useState('default');
  const [activeSidebarItem, setActiveSidebarItem] = useState('home');
  const [currentCode, setCurrentCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isInBackground, setIsInBackground] = useState(false);
  const [editorPreloaded, setEditorPreloaded] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.electron !== undefined);
    
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      setIsInBackground(isHidden);

      if (isHidden && window.electron) {
        window.electron.invoke('optimize-memory');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    window.addEventListener('blur', () => setIsInBackground(true));
    window.addEventListener('focus', () => setIsInBackground(false));
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', () => setIsInBackground(true));
      window.removeEventListener('focus', () => setIsInBackground(false));
    };
  }, []);

  useEffect(() => {
    async function loadSavedTabs() {
      if (isElectron) {
        try {
          const result = await window.electron.invoke('load-tabs');
          if (result.success && result.data) {
            setScriptTabs(result.data.tabs);

            if (result.data.activeTabId && result.data.tabs.some(tab => tab.id === result.data.activeTabId)) {
              setActiveTabId(result.data.activeTabId);
            } else {
              setActiveTabId(result.data.tabs[0].id);
            }
          }
        } catch (error) {
          console.error(error);
          setScriptTabs([DEFAULT_TAB]);
          setActiveTabId('default');
        }
      }
    }
    
    if (isElectron) {
      loadSavedTabs();
    }
  }, [isElectron]);
  

  useEffect(() => {
    if (isInBackground) {
    } else {
    }
  }, [isInBackground]);
  
  useEffect(() => {
    const loadAutoSaveSetting = async () => {
      if (isElectron) {
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
    
    if (isElectron) {
      loadAutoSaveSetting();
    }
  }, [isElectron]);
  
  useEffect(() => {
    const settingsChangeHandler = async (event) => {
      if (event.detail && event.detail.settings) {
        setAutoSaveEnabled(event.detail.settings.autoSave);
      }
    };
    
    window.addEventListener('settings-changed', settingsChangeHandler);
    
    return () => {
      window.removeEventListener('settings-changed', settingsChangeHandler);
    };
  }, []);

  useEffect(() => {
    async function saveTabs() {
      if (isElectron && scriptTabs.length > 0 && autoSaveEnabled) {
        setIsSaving(true);
        
        try {
          await window.electron.invoke('save-tabs', {
            tabs: scriptTabs, 
            activeTabId
          });

          setTimeout(() => {
            setIsSaving(false);
          }, 100);
        } catch (error) {
          console.error(error);
          setIsSaving(false);
        }
      }
    }
    
    if (isElectron && autoSaveEnabled) {
      const debounceTime = isInBackground ? 2000 : 300;
      
      const debounceTimer = setTimeout(() => {
        saveTabs();
      }, debounceTime);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [scriptTabs, activeTabId, isElectron, isInBackground, autoSaveEnabled]);


  const saveTabsManually = async () => {
    if (isElectron && scriptTabs.length > 0) {
      setIsSaving(true);
      
      try {
        await window.electron.invoke('save-tabs', {
          tabs: scriptTabs, 
          activeTabId
        });
        
        setTimeout(() => {
          setIsSaving(false);
        }, 800);
      } catch (error) {
        console.error(error);
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    const tab = scriptTabs.find(tab => tab.id === activeTabId);
    if (tab) {
      setCurrentCode(tab.code);
    }
  }, [activeTabId, scriptTabs]);

  const updateActiveTabCode = (newCode) => {
    setCurrentCode(newCode);
    setScriptTabs(tabs => 
      tabs.map(tab => 
        tab.id === activeTabId ? { ...tab, code: newCode } : tab
      )
    );
  };

  const executeCode = async () => {
    if (!currentCode || currentCode.trim() === '') {
      alert('I cant execute an empty script.');
      return;
    }

    if (typeof window.electron !== 'undefined') {
      try {

        await window.electron.invoke('toggle-power-save-blocker', true);
        
        let checkResult;
        try {
          checkResult = await window.electron.invoke('check-hydrogen');
        } catch (connectionError) {
          console.error("Error checking Hydrogen connection:", connectionError);
          alert("Error checking Hydrogen connection: " + connectionError.message);
          await window.electron.invoke('toggle-power-save-blocker', false);
          return;
        }
        
        if (!checkResult || !checkResult.connected) {
          alert("Cannot connect to Hydrogen! Please make sure it's running.");
          await window.electron.invoke('toggle-power-save-blocker', false);
          return;
        }
        
        const result = await window.electron.invoke('execute-code', currentCode);

        await window.electron.invoke('toggle-power-save-blocker', false);
        
        if (result.success) {
        } else {
          alert(`${result.message}`);
        }
      } catch (error) {
        await window.electron.invoke('toggle-power-save-blocker', false);
        
        console.error(error);
        alert(`${error.message}`);
      }
    } else {
      alert("NocturnalUI is not running in Electron.");
    }
  };

  const addNewTab = () => {
    const newId = uuidv4();
    const newTab = {
      id: newId,
      name: `Script ${scriptTabs.length + 1}`,
      code: '-- New script'
    };
    
    setScriptTabs([...scriptTabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (tabId) => {
    if (scriptTabs.length <= 1) return;
    
    const newTabs = scriptTabs.filter(tab => tab.id !== tabId);
    setScriptTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const renameTab = (tabId, newName) => {
    setScriptTabs(tabs => 
      tabs.map(tab => 
        tab.id === tabId ? { ...tab, name: newName } : tab
      )
    );
  };

  const sidebarItems = [
    { id: 'home', name: 'Home', icon: '' },
    { id: 'scripts', name: 'Scripts', icon: '' },
    { id: 'settings', name: 'Settings', icon: '' },
  ];

  const renderMainContent = () => {
    switch (activeSidebarItem) {
      case "home":
        return <HomePage />;
      case "scripts":
        return (
          <>
            <Tabs 
              tabs={scriptTabs}
              activeTab={activeTabId}
              setActiveTab={setActiveTabId}
              onNewTab={addNewTab}
              onCloseTab={closeTab}
              onRenameTab={renameTab}
            />
            
            <div className="main-content-wrapper">
              <EditorWrapper 
                code={currentCode} 
                setCode={updateActiveTabCode} 
                onExecute={executeCode} 
              />
            </div>
          </>
        );
      
      case "console":
        return <ConsolePage />;
      case "settings":
        return <SettingsPage onSaveTabsManually={saveTabsManually} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-container">
      <EditorPreload />
      
      <TitleBar isSaving={false} />
      
      <Sidebar 
        items={sidebarItems}
        activeItem={activeSidebarItem}
        setActiveItem={setActiveSidebarItem}
      />
      
      <main className="main-content">
        {renderMainContent()}
      </main>
    </div>
  );
}
