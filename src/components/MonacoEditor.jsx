"use client";

import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { setupLuaLanguage } from "../lib/luaLanguageSetup";
import { injectMonacoIcons } from "../lib/monacoIconFont";
import CommandPalette from "./CommandPalette";

export default function MonacoEditor({ code, setCode, onExecute, tabId, isTabSwitching, scriptTabs }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const modelRef = useRef(null);
  const previousTabIdRef = useRef(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: false,
    lineNumbers: true
  });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isCodeEmpty, setIsCodeEmpty] = useState(!code || code.trim() === '');
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  
  const modelCacheRef = useRef({});
  
  const isUpdatingRef = useRef(false);
  useEffect(() => {
    if (tabId && previousTabIdRef.current && tabId !== previousTabIdRef.current) {
      
      if (monacoRef.current) {
        try {
          const prevUri = monacoRef.current.Uri.parse(`inmemory://tab/${previousTabIdRef.current}.lua`);
          const prevModel = monacoRef.current.editor.getModel(prevUri);
          if (prevModel && prevModel !== modelRef.current) {
            prevModel.dispose();
          }
        } catch (error) {
          console.error(error);
        }
      }
      
      previousTabIdRef.current = tabId;
    } else if (tabId && !previousTabIdRef.current) {
      previousTabIdRef.current = tabId;
    }
  }, [tabId]);

  useEffect(() => {
    if (!monacoRef.current || scriptTabs?.length <= 1) return;
    
    const preloadTabs = async () => {
      const monaco = monacoRef.current;
      
      if (!monaco) return;
      
      const currentTabIndex = scriptTabs.findIndex(tab => tab.id === tabId);
      if (currentTabIndex > -1) {
        if (currentTabIndex < scriptTabs.length - 1) {
          const nextTab = scriptTabs[currentTabIndex + 1];
          if (nextTab && !modelCacheRef.current[nextTab.id]) {
            const uri = monaco.Uri.parse(`inmemory://tab/${nextTab.id}.lua`);
            if (!monaco.editor.getModel(uri)) {
              const model = monaco.editor.createModel(nextTab.code || '', 'lua', uri);
              modelCacheRef.current[nextTab.id] = model;
            }
          }
        }
        
        if (currentTabIndex > 0) {
          const prevTab = scriptTabs[currentTabIndex - 1];
          if (prevTab && !modelCacheRef.current[prevTab.id]) {
            const uri = monaco.Uri.parse(`inmemory://tab/${prevTab.id}.lua`);
            if (!monaco.editor.getModel(uri)) {
              const model = monaco.editor.createModel(prevTab.code || '', 'lua', uri);
              modelCacheRef.current[prevTab.id] = model;
            }
          }
        }
      }
    };
    
    const timer = setTimeout(preloadTabs, 100);
    return () => clearTimeout(timer);
  }, [tabId, scriptTabs]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !tabId) return;
    
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    requestAnimationFrame(() => {
      try {
        const uri = monaco.Uri.parse(`inmemory://tab/${tabId}.lua`);

        let model = modelCacheRef.current[tabId];
        
        if (!model) {
          model = monaco.editor.getModel(uri);
          
          if (!model) {
            model = monaco.editor.createModel(code || '', 'lua', uri);
            modelCacheRef.current[tabId] = model;
          }
        }
        
        if (!isTabSwitching && model.getValue() !== code) {
          model.setValue(code || '');
        }
        if (editor.getModel() !== model) {
          editor.setModel(model);
        }
        
        modelRef.current = model;
      } catch (error) {
        console.error(error);
      }
    });
  }, [tabId, code, isTabSwitching]);

  useEffect(() => {
    if (!editorRef.current || !tabId) return;
    
    if (isTabSwitching) {
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      
      if (editorRef.current.getDomNode()) {
        editorRef.current.getDomNode().classList.add('no-focus-indicator');
      }
    } else {
      if (editorRef.current.getDomNode()) {
        editorRef.current.getDomNode().classList.remove('no-focus-indicator');
      }
    }
  }, [isTabSwitching, tabId]);

  useEffect(() => {
    if (!editorRef.current || !tabId) return;
    
    const editorDom = editorRef.current.getDomNode();
    if (!editorDom) return;
    
    const editorParent = editorDom.closest('.monaco-editor-container');
    
    if (isTabSwitching) {
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      
      if (editorParent) {
        editorParent.classList.add('suppress-borders');
      }
      
      const allBorders = editorDom.querySelectorAll('.monaco-editor, .overflow-guard, .editor-scrollable');
      allBorders.forEach(el => {
        el.style.border = 'none';
        el.style.outline = 'none';
        el.style.transition = 'none';
      });
    } else {
      if (editorParent) {
        editorParent.classList.remove('suppress-borders');
      }
    }
  }, [isTabSwitching, tabId]);

  useEffect(() => {
    setIsCodeEmpty(!code || code.trim() === '');
  }, [code]);

  useEffect(() => {
    const loadSettings = async () => {
      if (typeof window.electron !== 'undefined') {
        try {
          const result = await window.electron.invoke('load-settings');
          if (result.success) {
            setEditorSettings({
              fontSize: result.data.fontSize || 14,
              tabSize: result.data.tabSize || 2,
              wordWrap: result.data.wordWrap !== undefined ? result.data.wordWrap : true,
              minimap: result.data.minimap || false,
              lineNumbers: result.data.lineNumbers !== undefined ? result.data.lineNumbers : true
            });
            setAutoSaveEnabled(result.data.autoSave !== undefined ? result.data.autoSave : true);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    loadSettings();
    
    const handleSettingsChanged = (event) => {
      if (event.detail && event.detail.settings) {
        setAutoSaveEnabled(event.detail.settings.autoSave);
      }
    };
    
    window.addEventListener('settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, []);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    window.editor = editor;
    
    setIsEditorLoading(false);
    
    if (editor.getDomNode()) {
      editor.getDomNode().classList.add('monaco-custom-editor');
    }
    
    setupLuaLanguage(monaco);
    
    const uri = monaco.Uri.parse(`inmemory://tab/${tabId}.lua`);
    let model = monaco.editor.getModel(uri);
    
    if (!model) {
      model = monaco.editor.createModel(code || '', 'lua', uri);
    } else if (model.getValue() !== code) {
      model.setValue(code || '');
    }
    
    modelCacheRef.current[tabId] = model;
    
    editor.setModel(model);
    modelRef.current = model;
    
    previousTabIdRef.current = tabId;
    window.dispatchEvent(new CustomEvent('monaco-ready'));

    if (!autoSaveEnabled && monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});
    }
    
    const originalAddEventListener = editor.onDidFocusEditorText;
    editor.onDidFocusEditorText = function(listener) {
      const originalDisposable = originalAddEventListener.call(this, function(...args) {
        if (!isUpdatingRef.current) {
          listener(...args);
        }
      });
      
      return originalDisposable;
    };
    
    const originalBlurListener = editor.onDidBlurEditorText;
    editor.onDidBlurEditorText = function(listener) {
      const originalDisposable = originalBlurListener.call(this, function(...args) {
        if (!isUpdatingRef.current) {
          listener(...args);
        }
      });
      
      return originalDisposable;
    };

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      setCommandPaletteVisible(true);
    });
    
    editor.addCommand(monaco.KeyCode.F1, () => {
      setCommandPaletteVisible(true);
    });
    
    window.addEventListener('execute-script', handleExecute);
    window.addEventListener('clear-editor', () => setCode(""));
    window.addEventListener('execute-tool', handleToolExecution);
  }

  const handleToolExecution = async (event) => {
    const toolId = event.detail?.toolId;
    if (!toolId) return;
    
    if (typeof window.electron !== 'undefined') {
      try {
        await window.electron.invoke('toggle-power-save-blocker', true);
        
        let checkResult;
        try {
          checkResult = await window.electron.invoke('check-hydrogen');
        } catch (connectionError) {
          console.error(connectionError);
          await window.electron.invoke('toggle-power-save-blocker', false);
          return;
        }
        
        if (!checkResult || !checkResult.connected) {
          alert("Cannot connect to Hydrogen! Please make sure it's running.");
          await window.electron.invoke('toggle-power-save-blocker', false);
          return;
        }
        
        const result = await window.electron.invoke('execute-tool', toolId);
        await window.electron.invoke('toggle-power-save-blocker', false);
        
        if (!result.success) {
        }
      } catch (error) {
        await window.electron.invoke('toggle-power-save-blocker', false);
        console.error(error);
      }
    } else {
      alert("NocturnalUI is not running in Electron...");
    }
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      window.removeEventListener('execute-script', handleExecute);
      window.removeEventListener('clear-editor', () => {});
      window.removeEventListener('execute-tool', handleToolExecution);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (monacoRef.current) {
        Object.values(modelCacheRef.current).forEach(model => {
          try {
            if (model) model.dispose();
          } catch (e) {
            console.error(e);
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    if (isTabSwitching) {
      isUpdatingRef.current = true;
      
      requestAnimationFrame(() => {
        const container = document.querySelector('.monaco-editor-container');
        if (container) {
          container.style.visibility = 'hidden';
          
          if (editorRef.current) {
            editorRef.current.updateOptions({ readOnly: true });
          }
        }
      });
    } else {
      setTimeout(() => {
        const container = document.querySelector('.monaco-editor-container');
        if (container) {
          setTimeout(() => {
            container.style.visibility = 'visible';

            if (editorRef.current) {
              editorRef.current.updateOptions({ readOnly: false });
            }
            
            isUpdatingRef.current = false;
          }, 20);
        }
      }, 10);
    }
  }, [isTabSwitching]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !tabId || isUpdatingRef.current) {
      return;
    }
    
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    
    Promise.resolve().then(() => {
      try {
        const uri = monaco.Uri.parse(`inmemory://tab/${tabId}.lua`);
        
        let model = monaco.editor.getModel(uri) || monaco.editor.createModel(code || '', 'lua', uri);

        modelCacheRef.current[tabId] = model;
        
        if (!isTabSwitching && model.getValue() !== code) {
          model.setValue(code || '');
        }
        
        requestAnimationFrame(() => {
          if (editor && model && !editor.isDisposed() && !model.isDisposed()) {
            if (editor.getModel() !== model) {
              editor.setModel(model);
            }
            modelRef.current = model;
          }
        });
      } catch (error) {
        console.error(error);
      }
    });
  }, [tabId, code, isTabSwitching]);

  useEffect(() => {
    if (isTabSwitching) {
      isUpdatingRef.current = true;

      requestAnimationFrame(() => {
        const container = document.querySelector('.monaco-editor-container');
        if (container) {
          container.classList.add('monaco-editor-hidden');
        }
        
        if (editorRef.current) {
          editorRef.current.updateOptions({ readOnly: true });
        }
      });
    } else {
      setTimeout(() => {
        const container = document.querySelector('.monaco-editor-container');
        if (container) {
          container.classList.remove('monaco-editor-hidden');
        }
        
        if (editorRef.current) {
          editorRef.current.updateOptions({ readOnly: false });
        }
        
        isUpdatingRef.current = false;
      }, 30);
    }
  }, [isTabSwitching]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !tabId || isUpdatingRef.current) {
      return;
    }
    
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    
    Promise.resolve().then(() => {
      try {
        const uri = monaco.Uri.parse(`inmemory://tab/${tabId}.lua`);
        let model = modelCacheRef.current[tabId] || monaco.editor.getModel(uri);
        
        if (!model) {
          model = monaco.editor.createModel(code || '', 'lua', uri);
          modelCacheRef.current[tabId] = model;
        } else if (!isTabSwitching && model.getValue() !== code) {
          model.setValue(code || '');
        }
        
        if (editor.getModel() !== model) {
          editor.setModel(model);
        }
        
        modelRef.current = model;
      } catch (error) {
        console.error("Error updating Monaco model:", error);
      }
    });
  }, [tabId, code, isTabSwitching]);

  useEffect(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    if (isTabSwitching) {
      setIsEditorLoading(true);
    } else {
      loadingTimeoutRef.current = setTimeout(() => {
        setIsEditorLoading(false);
      }, 100);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isTabSwitching]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const handleExecute = async () => {
    if (isCodeEmpty) return;
    setIsExecuting(true);
    await onExecute();
    setIsExecuting(false);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 relative min-h-[100px] h-[calc(100%-52px)] overflow-hidden bg-[#121212] border-0">
        {(isEditorLoading || isTabSwitching) && (
          <div className="absolute inset-0 z-10 bg-[#121212] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-t-transparent border-[#333333] rounded-full animate-spin"></div>
          </div>
        )}
        
        <Editor
          height="100%"
          defaultLanguage="lua"
          value={code}
          onChange={(newValue) => {
            if (isTabSwitching) return;
            setCode(newValue);
          }}
          onMount={handleEditorDidMount}
          loading={<div className="w-full h-full bg-[#121212]" />}
          theme="vs-dark"
          beforeMount={(monaco) => {
            setIsEditorLoading(true);
            
            monaco.editor.defineTheme('vs-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#121212',
                'editor.foreground': '#ffffff',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#c6c6c6',
                'editorCursor.foreground': '#ffffff',
                'editor.selectionBackground': '#264f78',
                'editor.inactiveSelectionBackground': '#3a3d41'
              }
            });
          }}
          options={{
            fontSize: editorSettings.fontSize,
            minimap: { enabled: editorSettings.minimap },
            scrollBeyondLastLine: false,
            fontFamily: "JetBrains Mono, monospace",
            smoothScrolling: true, 
            contextmenu: true,
            cursorBlinking: "phase", 
            cursorSmoothCaretAnimation: true, 
            formatOnPaste: false,
            lineNumbers: editorSettings.lineNumbers ? "on" : "off",
            padding: { top: 8, bottom: 8 },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            parameterHints: { enabled: true },
            tabSize: editorSettings.tabSize,
            wordWrap: editorSettings.wordWrap ? "on" : "off",
            folding: false,
            snippetSuggestions: 'inline',
            suggest: {
              showMethods: true,
              showFunctions: true,
              showClasses: true, 
              showVariables: true,
              showWords: true,
              showProperties: true
            }
          }}
          className="font-mono select-text cursor-text"
        />
      </div>
      <div className="h-[52px] min-h-[52px] max-h-[52px] flex px-4 justify-between items-center bg-[#121212] relative z-[15] w-full flex-shrink-0 box-border overflow-visible border-t border-[#333333]">
        <div className="flex items-center">
          <button 
            className="text-[--foreground] hover:text-white bg-transparent border-none px-2 py-2 cursor-pointer font-medium transition-opacity opacity-80 text-[15px] whitespace-nowrap hover:opacity-100 active:translate-y-[1px]"
            onClick={() => setCode("")}
            style={{ backgroundColor: 'transparent !important' }}
          >
            Clear
          </button>
          <div className="w-[1px] h-[18px] bg-[--border] mx-[10px]"></div>
          <button 
            className={`text-[--foreground] hover:text-white bg-transparent border-none px-2 py-2 cursor-pointer font-medium transition-opacity opacity-80 text-[15px] whitespace-nowrap hover:opacity-100 active:translate-y-[1px] ${isCodeEmpty ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
            onClick={() => navigator.clipboard.writeText(code)}
            disabled={isCodeEmpty}
            style={{ backgroundColor: 'transparent !important' }}
          >
            Copy
          </button>
        </div>
        <div className="flex-grow"></div>
        <button 
          className={`text-[--foreground] hover:text-white bg-transparent border-none px-2 py-2 cursor-pointer font-medium transition-opacity opacity-80 text-[15px] whitespace-nowrap hover:opacity-100 active:translate-y-[1px] flex items-center ${isCodeEmpty ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''} ${isExecuting ? 'bg-transparent' : ''}`}
          onClick={handleExecute}
          disabled={isExecuting || isCodeEmpty}
          title={isCodeEmpty ? "Can't execute empty script" : "Execute script"}
          style={{ backgroundColor: 'transparent !important' }}
        >
          <span className="text-xs mr-1">▶</span>
          <span>Execute</span>
        </button>
      </div>

      <CommandPalette 
        isVisible={commandPaletteVisible}
        setIsVisible={setCommandPaletteVisible}
        editor={editorRef.current}
        monaco={monacoRef.current}
      />
      
      <style jsx global>{`
        .monaco-editor .scrollbar .slider {
          background: #555555 !important;
          border-radius: 3px !important;
        }
        .monaco-editor .scrollbar.horizontal .slider {
          height: 4px !important;
        }
        .monaco-scrollable-element > .scrollbar > .slider {
          background: #555555 !important;
          border-radius: 3px !important;
        }
        .monaco-scrollable-element > .scrollbar > .slider:hover {
          background: #777777 !important;
        }
        .monaco-editor-background,
        .monaco-editor .margin {
          background-color: #121212 !important;
        }
        .monaco-editor, 
        .monaco-editor * {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          cursor: text !important;
          font-family: var(--font-mono) !important;
        }
        .monaco-editor, .monaco-editor * {
          outline: none !important;
          border-color: transparent !important;
        }
        .monaco-editor .view-lines,
        .monaco-editor .view-line {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          cursor: text !important;
        }
        .h-\\[52px\\] button {
          background-color: transparent !important;
          border: none !important;
        }
        
        .h-\\[52px\\] button:hover {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
}

