"use client";

import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function MonacoEditor({ code, setCode, onExecute }) {
  const editorRef = useRef(null);
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

  useEffect(() => {
    setIsCodeEmpty(!code || code.trim() === '');
  }, [code]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    
    window.dispatchEvent(new CustomEvent('monaco-ready'));
    
    if (!autoSaveEnabled && monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      });
    }

    editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      setIsCodeEmpty(!currentValue || currentValue.trim() === '');
      setCode(currentValue);

      window.dispatchEvent(new CustomEvent('code-changed'));

      if (Math.random() < 0.05) {
        if (typeof window.electron !== 'undefined') {
          window.electron.invoke('optimize-memory').catch(() => {
          });
        }
      }
    });
  }

  const handleExecute = async () => {
    if (isCodeEmpty) return;
    
    setIsExecuting(true);
    await onExecute();
    setIsExecuting(false);
  };

  return (
    <div className="editor-container">
      <div className="monaco-editor-container">
        <Editor
          height="100%"
          defaultLanguage="lua"
          value={code}
          onChange={setCode}
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

