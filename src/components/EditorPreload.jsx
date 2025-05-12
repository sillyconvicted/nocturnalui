"use client";

import React, { useEffect, useState } from 'react';

export default function EditorPreload() {
  const [isElectron, setIsElectron] = useState(false);
  
  useEffect(() => {
    setIsElectron(window.electron !== undefined);

    if (typeof window !== 'undefined') {
      window.__LUA_LANGUAGE_SETUP_COMPLETED = false;
      
      if (!window.__MONACO_EDITOR_SETTINGS) {
        window.__MONACO_EDITOR_SETTINGS = {
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          minimap: false,
          lineNumbers: true
        };
      }
      
      const oldStyle = document.getElementById('monaco-deprecated-styles');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      const styleEl = document.createElement('style');
      styleEl.id = 'monaco-deprecated-styles';
      styleEl.innerHTML = `
        .monaco-editor .mtk1.deprecated,
        .monaco-editor .deprecated {
          color: #FF5252 !important;
          text-decoration: underline wavy #FF5252 !important;
          font-style: italic !important;
          font-weight: bold !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const preloadTabs = async () => {
      if (window.electron) {
        try {
          const tabsResult = await window.electron.invoke('load-tabs');
          if (tabsResult.success && tabsResult.data?.tabs) {
            sessionStorage.setItem('preloadedTabs', JSON.stringify(tabsResult.data));
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };

    const preloadConsoleLogs = async () => {
      if (window.electron) {
        try {
          const logsResult = await window.electron.invoke('read-roblox-logs-preview', { limit: 50 });
          
          if (logsResult.success) {
            sessionStorage.setItem('preloadedConsoleLogs', JSON.stringify({
              entries: logsResult.entries || [],
              filteredCount: logsResult.filteredCount,
              totalCount: logsResult.totalCount,
              timestamp: Date.now(),
              isPreview: true
            }));
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };

    const preloadScriptLibrary = async () => {
      if (window.electron) {
        try {
          const result = await window.electron.invoke('load-local-scripts');
          if (result.success) {
            sessionStorage.setItem('preloadedLocalScripts', JSON.stringify(result.scripts || []));
            sessionStorage.setItem('needsRScriptsPreload', 'true');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    
    const loadEditorSettings = async () => {
      if (window.electron) {
        try {
          const result = await window.electron.invoke('load-settings');
          if (result.success) {
            window.__MONACO_EDITOR_SETTINGS = {
              fontSize: result.data.fontSize || 14,
              tabSize: result.data.tabSize || 2,
              wordWrap: result.data.wordWrap !== undefined ? result.data.wordWrap : true,
              minimap: result.data.minimap !== undefined ? result.data.minimap : false,
              lineNumbers: result.data.lineNumbers !== undefined ? result.data.lineNumbers : true
            };
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    
    const criticalPreload = async () => {
      await Promise.all([
        preloadTabs(),
        loadEditorSettings(),
        window.electron?.invoke('warm-up-monaco')
      ]).catch(err => {
        console.warn(err);
      });
    };
    
    const secondaryPreload = async () => {
      await preloadScriptLibrary().catch(err => {
        console.warn(err);
      });

      setTimeout(async () => {
        await preloadConsoleLogs().catch(err => {
          console.warn(err);
        });
      }, 2000);
    };

    criticalPreload();
    
    setTimeout(secondaryPreload, 500);

    document.body.classList.add('editor-loading');
    
    window.addEventListener('monaco-ready', () => {
      setTimeout(() => {
        document.body.classList.remove('editor-loading');
      }, 100);
    });

    setTimeout(() => {
      document.body.classList.remove('editor-loading');
    }, 2000);
    
    return () => {
      window.removeEventListener('monaco-ready', () => {});
      
      const styleEl = document.getElementById('monaco-deprecated-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);
  
  return null;
}
