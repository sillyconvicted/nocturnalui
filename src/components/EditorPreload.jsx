"use client";

import React, { useEffect, useState } from 'react';

export default function EditorPreload() {
  const [isElectron, setIsElectron] = useState(false);
  
  useEffect(() => {
    setIsElectron(window.electron !== undefined);
    
    document.body.classList.add('editor-loading');
    
    if (window.electron) {
      try {
        window.electron.invoke('warm-up-monaco').catch(err => {
          console.warn('Monaco warmup error:', err);
        });
      } catch (err) {
        console.warn('Monaco invoke error:', err);
      }
    }
    
    window.addEventListener('monaco-ready', () => {
      setTimeout(() => {
        document.body.classList.remove('editor-loading');
      }, 100);
    });
    
    setTimeout(() => {
      document.body.classList.remove('editor-loading');
    }, 2000);
  }, []);
  
  return null;
}
