import React, { useEffect } from 'react';
import HomePage from './page';

export default function App() {
  useEffect(() => {
    const loadThemeSetting = async () => {
      if (typeof window.electron !== 'undefined') {
        try {
          const result = await window.electron.invoke('load-settings');
          if (result.success) {
            if (result.data.pinkTheme) {
              document.body.classList.add('pink-theme');
              const metaThemeColor = document.querySelector('meta[name="theme-color"]');
              if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#130e14');
              } else {
                const meta = document.createElement('meta');
                meta.name = 'theme-color';
                meta.content = '#130e14';
                document.head.appendChild(meta);
              }
            } else {
              document.body.classList.remove('pink-theme');
              const metaThemeColor = document.querySelector('meta[name="theme-color"]');
              if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#0e0e0e');
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    loadThemeSetting();

    const applyThemeColorScheme = (isPink) => {
      const themeColor = isPink ? '#13091b' : '#0e0e0e';
      
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', themeColor);
      
      document.body.style.display = 'none';
      document.body.offsetHeight;
      document.body.style.display = '';
    };

    const updateMonacoTheme = (isPink) => {
      if (window.monaco) {
        try {
          window.monaco.editor.defineTheme('vs-dark', {
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
          window.monaco.editor.setTheme('vs-dark');
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    const handleSettingsChanged = (event) => {
      if (event.detail && event.detail.settings) {
        const isPink = event.detail.settings.pinkTheme;
        if (isPink) {
          document.body.classList.add('pink-theme');
        } else {
          document.body.classList.remove('pink-theme');
        }
        applyThemeColorScheme(isPink);
        updateMonacoTheme(isPink);
      }
    };
    
    window.addEventListener('settings-changed', handleSettingsChanged);
    
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, []);

  return (
    <div className="app-root">
      <HomePage />
    </div>
  );
}
