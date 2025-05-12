"use client";

import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { setupLuaLanguage } from "../lib/luaLanguageSetup";
import { injectMonacoIcons } from "../lib/monacoIconFont";
import CommandPalette from "./CommandPalette";

window.__LUA_LANGUAGE_SETUP_COMPLETED = window.__LUA_LANGUAGE_SETUP_COMPLETED || false;
window.__MONACO_EDITOR_SETTINGS = window.__MONACO_EDITOR_SETTINGS || {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  lineNumbers: true
};

export default function MonacoEditor({ code, setCode, onExecute, tabId, isTabSwitching, scriptTabs }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const modelRef = useRef(null);
  const previousTabIdRef = useRef(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editorSettings, setEditorSettings] = useState(window.__MONACO_EDITOR_SETTINGS);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isCodeEmpty, setIsCodeEmpty] = useState(!code || code.trim() === '');
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  
  const modelCacheRef = useRef({});
  
  const isUpdatingRef = useRef(false);
  const editorStateRestoredRef = useRef(false);
  const [isEditorMounted, setIsEditorMounted] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (typeof window.electron !== 'undefined') {
        try {
          const result = await window.electron.invoke('load-settings');
          if (result.success) {
            const newSettings = {
              fontSize: result.data.fontSize || 14,
              tabSize: result.data.tabSize || 2,
              wordWrap: result.data.wordWrap !== undefined ? result.data.wordWrap : true,
              minimap: result.data.minimap !== undefined ? result.data.minimap : false,
              lineNumbers: result.data.lineNumbers !== undefined ? result.data.lineNumbers : true
            };
            
            setEditorSettings(newSettings);
            window.__MONACO_EDITOR_SETTINGS = newSettings;
            
            setAutoSaveEnabled(result.data.autoSave !== undefined ? result.data.autoSave : true);
            
            if (editorRef.current && monacoRef.current) {
              editorRef.current.updateOptions({
                fontSize: newSettings.fontSize,
                tabSize: newSettings.tabSize,
                wordWrap: newSettings.wordWrap ? "on" : "off",
                minimap: { enabled: newSettings.minimap },
                lineNumbers: newSettings.lineNumbers ? "on" : "off"
              });
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    loadSettings();
    
    const handleSettingsChanged = (event) => {
      if (event.detail && event.detail.settings) {
        const newSettings = {
          ...editorSettings,
          ...event.detail.settings,
        };
        
        setEditorSettings(newSettings);
        window.__MONACO_EDITOR_SETTINGS = newSettings;
        setAutoSaveEnabled(event.detail.settings.autoSave !== undefined ? event.detail.settings.autoSave : autoSaveEnabled);

        if (editorRef.current && !editorRef.current.isDisposed?.()) {
          editorRef.current.updateOptions({
            fontSize: newSettings.fontSize,
            tabSize: newSettings.tabSize,
            wordWrap: newSettings.wordWrap ? "on" : "off",
            minimap: { enabled: newSettings.minimap },
            lineNumbers: newSettings.lineNumbers ? "on" : "off"
          });
        }
      }
    };
    
    window.addEventListener('settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, []);

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
    setIsCodeEmpty(!code || code.trim() === '');
  }, [code]);

  let handleThemeChangeRef = null;

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    window.editor = editor;
    
    setIsEditorLoading(false);
    setIsEditorMounted(true);
    editorStateRestoredRef.current = true;
    
    if (editor.getDomNode()) {
      editor.getDomNode().classList.add('monaco-custom-editor');
    }
    
    if (!window.__LUA_LANGUAGE_SETUP_COMPLETED) {
      setupLuaLanguage(monaco);
      window.__LUA_LANGUAGE_SETUP_COMPLETED = true;
    }
    
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
    window.monaco = monaco; 
    
    editor.updateOptions({
      fontSize: editorSettings.fontSize,
      tabSize: editorSettings.tabSize,
      wordWrap: editorSettings.wordWrap ? "on" : "off",
      minimap: { enabled: editorSettings.minimap },
      lineNumbers: editorSettings.lineNumbers ? "on" : "off",
      scrollBeyondLastLine: false,
      fontFamily: "JetBrains Mono, monospace",
      smoothScrolling: true,
      contextmenu: false,
      cursorBlinking: "phase",
      cursorSmoothCaretAnimation: true,
      formatOnPaste: false,
      padding: { top: 8, bottom: 8 },
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      parameterHints: { enabled: true },
      folding: false,
      snippetSuggestions: 'inline',
      suggest: {
        showMethods: true,
        showFunctions: true,
        showClasses: true, 
        showVariables: true,
        showWords: true,
        showProperties: true
      },
      scrollbar: {
        horizontal: 'hidden',
        useShadows: false,
        verticalScrollbarSize: 6,
      },
    });
    
    handleThemeChangeRef = (event) => {
      if (event.detail && event.detail.settings) {
        const isPink = event.detail.settings.pinkTheme;
        monaco.editor.defineTheme('vs-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': isPink ? '#1a0e25' : '#121212',
            'editor.foreground': '#ffffff',
            'editorLineNumber.foreground': isPink ? '#ff68ce' : '#858585',
            'editorLineNumber.activeForeground': isPink ? '#ff8cda' : '#c6c6c6',
            'editorCursor.foreground': isPink ? '#ff46c5' : '#ffffff',
            'editor.selectionBackground': isPink ? '#481b63' : '#264f78',
            'editor.lineHighlightBackground': isPink ? 'rgba(255, 70, 197, 0.15)' : 'rgba(33, 33, 33, 0.4)',
            'editor.inactiveSelectionBackground': '#3a3d41'
          }
        });
        monaco.editor.setTheme('vs-dark');
      }
    };
    window.addEventListener('settings-changed', handleThemeChangeRef);

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

  useEffect(() => {
    return () => {
      if (editorRef.current && typeof editorRef.current.dispose === 'function') {
        try {
          editorRef.current.dispose();
        } catch (e) {
          console.error(e);
        }
      }
      
      if (monacoRef.current) {
        try {
          Object.values(modelCacheRef.current).forEach(model => {
            if (model && typeof model.dispose === 'function') {
              model.dispose();
            }
          });
        } catch (e) {
          console.error(e);
        }
      }
      
      window.removeEventListener('execute-script', handleExecute);
      window.removeEventListener('clear-editor', () => {});
      window.removeEventListener('execute-tool', handleToolExecution);
      
      if (handleThemeChangeRef) {
        window.removeEventListener('settings-changed', handleThemeChangeRef);
      }
      
      setIsEditorMounted(false);
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
        <div className="monaco-wrapper">
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
            options={{
              fontSize: editorSettings.fontSize,
              minimap: { 
                enabled: editorSettings.minimap,
                side: 'right',
                showSlider: 'mouseover',
                renderCharacters: false,
                maxColumn: 120
              },
              scrollBeyondLastLine: false,
              fontFamily: "JetBrains Mono, monospace",
              smoothScrolling: true, 
              contextmenu: false,
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
              },
              scrollbar: {
                horizontal: 'hidden',
                useShadows: false,
                verticalScrollbarSize: 6,
              },
            }}
            className="font-mono select-text cursor-text"
            key={`monaco-editor-${isEditorMounted ? 'mounted' : 'unmounted'}`}
          />
        </div>
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
      
      <style jsx data-global="true">{`
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
        .monaco-editor-container {
          transition: opacity 0.2s ease-out;
        }
        .monaco-editor-hidden {
          opacity: 0.9;
        }
        .editor-loading {
          transition: opacity 0.2s ease;
        }
        .monaco-editor .loading-indicator {
          display: none !important;
        }
        .monaco-editor .suggest-widget .monaco-list .monaco-list-row .suggest-icon {
          display: none !important;
          visibility: hidden !important;
          width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .monaco-editor .suggest-widget .monaco-list .monaco-list-row .monaco-icon-label {
          padding-left: 4px !important; 
        }
        .monaco-editor .suggest-widget .monaco-list .monaco-list-row .monaco-icon-name-container {
          padding-left: 0 !important;
        }
        .monaco-editor-container {
          transition: opacity 0.2s ease-out;
          will-change: opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .monaco-editor-hidden {
          opacity: 0.95; 
        }
        .monaco-editor, 
        .monaco-editor-background,
        .monaco-editor .overflow-guard {
          backface-visibility: hidden !important;
          transform: translateZ(0) !important;
        }
        .editor-loading {
          transition: opacity 0.25s ease-out;
        }
        .monaco-wrapper {
          position: relative;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: #121212;
        }
        body.pink-theme .monaco-editor-background,
        body.pink-theme .monaco-editor .margin {
          background-color: #1a0e25 !important;
        }
        body.pink-theme .monaco-editor .current-line {
          background-color: rgba(255, 70, 197, 0.1) !important;
          border-color: rgba(255, 70, 197, 0.1) !important;
        }
        body.pink-theme .monaco-editor .line-numbers {
          color: rgba(255, 70, 197, 0.6) !important;
        }
        body.pink-theme .monaco-editor .cursor {
          background-color: #ff46c5 !important;
          border-color: #ff46c5 !important;
        }
        body.pink-theme .monaco-editor .selected-text {
          background-color: rgba(255, 70, 197, 0.2) !important;
        }
        body.pink-theme .monaco-editor-container {
          box-shadow: inset 0 0 30px rgba(255, 70, 197, 0.03);
        }
        .monaco-editor .deprecated {
          text-decoration: underline wavy #FF5252 !important;
          font-style: italic !important;
          color: #FF5252 !important;
          font-weight: bold !important;
        }
        .monaco-editor .deprecated ~ .deprecated {
          text-decoration: underline wavy #FF5252 !important;
          font-style: italic !important;
          color: #FF5252 !important;
          font-weight: bold !important;
        }
        .monaco-editor .mtk1.deprecated {
          color: #FF5252 !important;
        }
        .monaco-editor .suggest-widget .monaco-list .monaco-list-row .monaco-highlighted-label .deprecated {
          color: #FF5252 !important;
          font-style: italic !important;
          text-decoration: underline wavy #FF5252 !important;
        }
        .monaco-editor .suggest-widget .monaco-list .monaco-list-row[aria-label*="[DEPRECATED]"] {
          padding-left: 4px !important;
        }
        .monaco-editor .suggest-widget .monaco-list .monaco-list-row[aria-label*="[DEPRECATED]"]:before {
          content: "⚠️";
          position: absolute;
          left: -18px;
          font-size: 12px;
        }
        body.pink-theme .monaco-editor .deprecated {
          color: #FF1493 !important;
          text-decoration-color: #FF1493 !important;
        }
        .monaco-editor .mtk1.deprecated,
        .monaco-editor .deprecated {
          color: #FF5252 !important;
          text-decoration: underline wavy #FF5252 !important;
          text-decoration-thickness: 1px !important;
          font-style: italic !important;
          font-weight: bold !important;
        }
        .monaco-editor [class*="mtk"].deprecated {
          color: #FF5252 !important;
          text-decoration: underline wavy #FF5252 !important;
          text-decoration-thickness: 1px !important;
          font-style: italic !important;
          font-weight: bold !important;
        }
        .monaco-editor .suggest-widget .monaco-list .monaco-list-row .monaco-highlighted-label .deprecated {
          color: #FF5252 !important;
          font-style: italic !important;
          text-decoration: underline wavy #FF5252 !important;
          font-weight: bold !important;
        }
        body.pink-theme .monaco-editor .deprecated,
        body.pink-theme .monaco-editor .mtk1.deprecated,
        body.pink-theme .monaco-editor [class*="mtk"].deprecated {
          color: #FF1493 !important;
          text-decoration-color: #FF1493 !important;
        }
        .monaco-editor-hover .hover-contents .deprecated,
        .monaco-editor .parameter-hints-widget .deprecated {
          color: #FF5252 !important;
          text-decoration: underline wavy #FF5252 !important;
          font-style: italic !important;
          font-weight: bold !important;
        }
      `}</style>
    </div>
  );
}

