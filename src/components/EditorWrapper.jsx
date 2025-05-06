"use client";

import React, { useEffect } from "react";
import MonacoEditor from "./MonacoEditor";

export default function EditorWrapper({ code, setCode, onExecute, tabName }) {
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
    <div className="editor-full-container">
      <MonacoEditor 
        code={code} 
        setCode={setCode} 
        onExecute={handleExecute} 
      />
    </div>
  );
}
