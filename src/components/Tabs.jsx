"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function Tabs({ 
  tabs, 
  activeTab, 
  setActiveTab, 
  onNewTab, 
  onCloseTab, 
  onRenameTab,
  getCurrentTabCode
}) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [newTabName, setNewTabName] = useState("");
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    tabId: null,
    animation: false
  });
  const contextMenuRef = useRef(null);

  const handleDoubleClick = (tabId, currentName) => {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.setAttribute('data-original-width', `${tabElement.offsetWidth}px`);
    }
    
    setEditingTabId(tabId);
    setNewTabName(currentName);
    
    setTimeout(() => {
      const input = document.querySelector('.tab-rename-input');
      if (input) {
        input.focus();
        input.select();
      }
    }, 10);
  };

  const handleRename = (tabId) => {
    if (newTabName.trim()) {
      onRenameTab(tabId, newTabName);
    }
    setEditingTabId(null);
  };

  const handleKeyDown = (e, tabId) => {
    if (e.key === "Enter") {
      handleRename(tabId);
    } else if (e.key === "Escape") {
      setEditingTabId(null);
    }
  };

  const handleContextMenu = (e, tabId) => {
    e.preventDefault();
    if (contextMenu.visible) {
      setContextMenu({...contextMenu, visible: false, animation: false});
      
      setTimeout(() => {
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          tabId: tabId,
          animation: true
        });
      }, 10);
    } else {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        tabId: tabId,
        animation: true
      });
    }
  };

  const saveToLocalLibrary = async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const code = getCurrentTabCode ? getCurrentTabCode(tabId) : tab.code;
    
    const newLocalScript = {
      id: uuidv4(),
      title: tab.name,
      code: code || '',
      dateSaved: new Date().toISOString(),
      game: ''
    };
    
    try {
      let localLibrary = [];
      
      if (typeof window.electron !== 'undefined') {
        const result = await window.electron.invoke('load-local-scripts');
        if (result.success) {
          localLibrary = result.scripts || [];
        }
      } else {
        try {
          const savedLibrary = localStorage.getItem('nocturnal-local-scripts');
          if (savedLibrary) {
            localLibrary = JSON.parse(savedLibrary);
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      localLibrary.push(newLocalScript);
      
      if (typeof window.electron !== 'undefined') {
        await window.electron.invoke('save-local-scripts', localLibrary);

        window.electron.invoke('show-notification', {
          title: 'Script Saved',
          body: `"${tab.name}" has been saved to your local library.`
        }).catch(console.error);
      } else {
      }
    } catch (error) {
      console.error(error);
    }

    setContextMenu({ ...contextMenu, visible: false, animation: false });
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ ...contextMenu, visible: false, animation: false });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false, animation: false });
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [contextMenu.visible]);

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab) => (
          <div 
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            data-tab-id={tab.id}
            style={editingTabId === tab.id ? { width: document.querySelector(`.tab[data-tab-id="${tab.id}"]`)?.getAttribute('data-original-width') || 'auto' } : {}}
            onClick={() => {
              if (editingTabId !== tab.id) {
                setActiveTab(tab.id);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                className="tab-rename-input"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onBlur={() => handleRename(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                onClick={(e) => e.stopPropagation()} 
                autoFocus
                spellCheck="false"
              />
            ) : (
              <span 
                className="tab-name"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(tab.id, tab.name);
                }}
              >
                {tab.name}
              </span>
            )}
          </div>
        ))}
        <button 
          className="new-tab-button"
          onClick={onNewTab}
        >
          +
        </button>
      </div>

      {contextMenu.visible && (
        <div 
          ref={contextMenuRef}
          className={`context-menu ${contextMenu.animation ? 'context-menu-animate' : ''}`}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <div 
            className="context-menu-item rename-item"
            onClick={() => {
              handleDoubleClick(contextMenu.tabId, tabs.find(tab => tab.id === contextMenu.tabId)?.name || '');
              setContextMenu({ ...contextMenu, visible: false, animation: false });
            }}
          >
            Rename
          </div>
          <div 
            className="context-menu-item save-item"
            onClick={() => {
              saveToLocalLibrary(contextMenu.tabId);
            }}
          >
            Save to Local Library
          </div>
          <div 
            className="context-menu-item close-item"
            onClick={() => {
              onCloseTab(contextMenu.tabId);
              setContextMenu({ ...contextMenu, visible: false, animation: false });
            }}
          >
            Close
          </div>
        </div>
      )}
    </div>
  );
}
