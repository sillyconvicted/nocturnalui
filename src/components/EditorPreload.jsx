"use client";

import React, { useEffect, useState } from 'react';

export default function EditorPreload() {
  const [isElectron, setIsElectron] = useState(false);
  
  useEffect(() => {
    setIsElectron(window.electron !== undefined);

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
    
    const criticalPreload = async () => {
      await Promise.all([
        preloadTabs(),
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
    };
  }, []);
  
  return null;
}
