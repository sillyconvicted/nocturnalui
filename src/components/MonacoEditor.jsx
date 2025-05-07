"use client";

import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

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
    
    if (editor.getDomNode()) {
      editor.getDomNode().classList.add('monaco-custom-editor');
    }
    
    const styleSheet1 = document.createElement('style');
    styleSheet1.textContent = `
      .monaco-custom-editor .monaco-editor-background, 
      .monaco-custom-editor .margin,
      .monaco-custom-editor .monaco-editor-background {
        border-color: transparent !important;
      }
      .no-focus-indicator * {
        border-color: transparent !important;
        outline: none !important;
      }
    `;
    document.head.appendChild(styleSheet1);
    
    const styleSheet2 = document.createElement('style');
    styleSheet2.textContent = `
      .monaco-editor, 
      .monaco-editor *, 
      .monaco-editor-background, 
      .monaco-editor .overflow-guard,
      .monaco-editor .editor-scrollable,
      .monaco-scrollable-element {
        border-color: transparent !important;
        outline: none !important;
        box-shadow: none !important;
      }
      
      .monaco-editor * {
        transition: none !important;
      }
      
      .monaco-editor.focused,
      .monaco-editor.focused * {
        outline: none !important;
        border-color: transparent !important;
      }
    `;
    document.head.appendChild(styleSheet2);
    
    
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
    
    editor.onDidChangeModelContent(() => {
      if (isTabSwitching) return;
      
      if (!editor.getModel() || editor.getModel().uri.path !== `/tab/${tabId}.lua`) {
        return;
      }
      
      requestAnimationFrame(() => {
        try {
          const currentValue = editor.getValue();
          
          if (modelRef.current?.getValue() === currentValue) {
            return;
          }
          
          setIsCodeEmpty(!currentValue || currentValue.trim() === '');
          setCode(currentValue);
          
          window.dispatchEvent(new CustomEvent('code-changed'));
        } catch (error) {
          console.error(error);
        }
      });
      
      if (Math.random() < 0.05) {
        if (typeof window.electron !== 'undefined') {
          window.electron.invoke('optimize-memory').catch(() => {});
        }
      }
    });

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
  }

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
    if (!editorRef.current) return;
    
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

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .monaco-editor, .monaco-editor * {
        outline: none !important;
        border-color: transparent !important;
      }
    `;
    document.head.appendChild(styleSheet);
    
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
    
    const originalFocusListener = editor.onDidFocusEditorText;
    editor.onDidFocusEditorText = function(listener) {
      return originalFocusListener.call(this, function(...args) {
        if (!isUpdatingRef.current) {
          listener(...args);
        }
      });
    };
    
    const originalBlurListener = editor.onDidBlurEditorText;
    editor.onDidBlurEditorText = function(listener) {
      return originalBlurListener.call(this, function(...args) {
        if (!isUpdatingRef.current) {
          listener(...args);
        }
      });
    };
    
    editor.onDidChangeModelContent(() => {
      if (isTabSwitching || isUpdatingRef.current) return;
      
      if (!editor.getModel() || editor.getModel().uri.path !== `/tab/${tabId}.lua`) {
        return;
      }
      
      requestAnimationFrame(() => {
        try {
          const currentValue = editor.getValue();
          if (modelRef.current?.getValue() === currentValue) return;
          
          setIsCodeEmpty(!currentValue || currentValue.trim() === '');
          setCode(currentValue);
          window.dispatchEvent(new CustomEvent('code-changed'));
        } catch (error) {
          console.error(error);
        }
      });
      
      if (Math.random() < 0.05 && window.electron) {
        window.electron.invoke('optimize-memory').catch(() => {});
      }
    });
    
    window.dispatchEvent(new CustomEvent('monaco-ready'));
  }

  const handleExecute = async () => {
    if (isCodeEmpty) return;
    setIsExecuting(true);
    await onExecute();
    setIsExecuting(false);
  };

  return (
    <div className="editor-container">
      <div className={`monaco-editor-container`}>
        <Editor
          height="100%"
          defaultLanguage="lua"
          value={code}
          onChange={(newValue) => {
            if (isTabSwitching) return;
            setCode(newValue);
          }}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('vs-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#1a1a1a',
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
            smoothScrolling: false, 
            contextmenu: true,
            cursorBlinking: "phase", 
            cursorSmoothCaretAnimation: "off", 
            formatOnPaste: false,
            lineNumbers: editorSettings.lineNumbers ? "on" : "off",
            padding: { top: 8, bottom: 8 },
            quickSuggestions: false,
            suggestOnTriggerCharacters: false, 
            folding: false,
            parameterHints: { enabled: false },
            tabSize: editorSettings.tabSize,
            wordWrap: editorSettings.wordWrap ? "on" : "off",
            renderLineHighlight: 'none',
            renderWhitespace: 'none',
            disableLayerHinting: true,
          }}
        />
      </div>
      <div className="control-panel">
        <div className="flex-start">
          <button className="btn-control" onClick={() => setCode("")}>
            Clear
          </button>
          <div className="control-divider"></div>
          <button 
            className="btn-control" 
            onClick={() => navigator.clipboard.writeText(code)}
            disabled={isCodeEmpty}
          >
            Copy
          </button>
        </div>
        <div className="flex-grow"></div>
        <button 
          className={`btn-control ${isExecuting ? 'executing' : ''} ${isCodeEmpty ? 'btn-disabled' : ''}`}
          onClick={handleExecute}
          disabled={isExecuting || isCodeEmpty}
          title={isCodeEmpty ? "Can't execute empty script" : "Execute script"}
        >
          <span className="execute-icon">▶</span>
          <span>Execute</span>
        </button>
      </div>
    </div>
  );
}

