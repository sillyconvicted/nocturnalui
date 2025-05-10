export function injectMonacoIcons() {
  const styleElement = document.getElementById('monaco-suggestion-styles');
  if (!styleElement) {
    const style = document.createElement('style');
    style.id = 'monaco-suggestion-styles';
    style.textContent = `
      .monaco-editor .suggest-widget .monaco-list .monaco-list-row .suggest-icon {
        display: none !important;
        width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .monaco-editor .suggest-widget .monaco-list .monaco-list-row {
        padding-left: 10px !important;
      }
      .monaco-editor .suggest-widget .monaco-list .monaco-list-row .monaco-icon-label-container {
        font-family: var(--font-mono) !important;
      }
      .monaco-editor .suggest-widget {
        border: 2px solid #3C3C3C !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        border-radius: 6px !important;
        overflow: hidden !important;
      }
      .monaco-editor .suggest-widget .monaco-list {
        background-color: #1E1E1E !important;
      }
      
      .monaco-editor .suggest-widget .details {
        border-left: 1px solid #3C3C3C !important;
        background-color: #252525 !important;
      }
      .monaco-editor .suggest-widget .monaco-list .monaco-list-row.focused {
        background-color: #04395E !important;
      }
    `;
    document.head.appendChild(style);
  }
}
