"use client";

import React, { useEffect, useState, useRef } from "react";
import MonacoEditor from "./MonacoEditor";

export default function EditorWrapper({ code, setCode, onExecute, tabName, tabId, isTabSwitching, scriptTabs }) {
  const [lastStableTabId, setLastStableTabId] = useState(tabId);
  const [localTabId, setLocalTabId] = useState(tabId);
  const previousTabId = useRef(tabId);
  
  useEffect(() => {
    if (tabId !== previousTabId.current) {
      previousTabId.current = tabId;
      if (!isTabSwitching) {
        setLocalTabId(tabId);
        setLastStableTabId(tabId);
      }
    }
  }, [tabId, isTabSwitching]);

  useEffect(() => {
    const updateDiscordStatus = async () => {
      if (typeof window.electron !== 'undefined') {
        try {
          await window.electron.invoke('update-discord-status', {
            type: 'coding',
            data: { 
              scriptName: tabName || 'Script'
            }
          });
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    updateDiscordStatus();
  }, [tabName]);

  const handleExecute = async () => {
    if (typeof window.electron !== 'undefined') {
      try {
        await window.electron.invoke('update-discord-status', {
          type: 'executing',
          data: {}
        });
      } catch (error) {
        console.error(error);
      }
    }
    
    onExecute();
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#121212] transform-gpu">
      <MonacoEditor 
        code={code} 
        setCode={setCode} 
        onExecute={handleExecute}
        tabId={isTabSwitching ? lastStableTabId : localTabId}
        isTabSwitching={isTabSwitching} 
        scriptTabs={scriptTabs}
      />
    </div>
  );
}
