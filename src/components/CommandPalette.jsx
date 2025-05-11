"use client";

import { useState, useEffect, useRef } from 'react';

export default function CommandPalette({ isVisible, setIsVisible, editor, monaco }) {
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState([]);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categorizedCommands, setCategorizedCommands] = useState({});
  const inputRef = useRef(null);
  const commandListRef = useRef(null);

  const [visibleCategories, setVisibleCategories] = useState([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const handleTabNumberCommand = (tabNumber) => {
    if (typeof tabNumber !== 'number' || isNaN(tabNumber) || tabNumber < 1) return;
    
    window.dispatchEvent(new CustomEvent('switch-to-tab-number', { 
      detail: { tabNumber: tabNumber } 
    }));
    setIsVisible(false);
  };

  useEffect(() => {
    const commands = [
      {
        id: 'execute-script',
        label: 'Execute Script',
        keybinding: 'F5',
        category: 'Nocturnal Commands',
        action: () => window.dispatchEvent(new CustomEvent('execute-script')),
        description: 'Run the current script'
      },
      {
        id: 'clear-editor',
        label: 'Clear Editor',
        keybinding: 'Ctrl+L',
        category: 'Nocturnal Commands',
        action: () => window.dispatchEvent(new CustomEvent('clear-editor')),
        description: 'Clear all content in the editor'
      },
      {
        id: 'new-tab',
        label: 'New Tab',
        keybinding: 'Ctrl+T',
        category: 'Nocturnal Commands',
        action: () => window.dispatchEvent(new CustomEvent('new-tab')),
        description: 'Create a new script tab'
      },
      {
        id: 'save-script',
        label: 'Save Script to Library',
        keybinding: 'Ctrl+S',
        category: 'Nocturnal Commands',
        action: () => window.dispatchEvent(new CustomEvent('save-script')),
        description: 'Save current script to local library'
      },
      {
        id: 'next-tab',
        label: 'Go to Next Tab',
        keybinding: 'Ctrl+Tab',
        category: 'Nocturnal Commands',
        action: () => {
          window.dispatchEvent(new CustomEvent('switch-tab', { 
            detail: { direction: 'next' } 
          }));
        },
        description: 'Switch to the next editor tab'
      },
      {
        id: 'previous-tab',
        label: 'Go to Previous Tab',
        keybinding: 'Ctrl+Shift+Tab',
        category: 'Nocturnal Commands',
        action: () => {
          window.dispatchEvent(new CustomEvent('switch-tab', { 
            detail: { direction: 'previous' } 
          }));
        },
        description: 'Switch to the previous editor tab'
      },

      {
        id: 'go-to-home',
        label: 'Go to Home',
        category: 'Navigation',
        action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'home' } })),
        description: 'Navigate to home page'
      },
      {
        id: 'go-to-editor',
        label: 'Go to Editor',
        category: 'Navigation',
        action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'main' } })),
        description: 'Navigate to editor page'
      },
      {
        id: 'go-to-library',
        label: 'Go to Script Library',
        category: 'Navigation',
        action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'scripthub' } })),
        description: 'Navigate to script library'
      },
      {
        id: 'go-to-console',
        label: 'Go to Console',
        category: 'Navigation',
        action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'console' } })),
        description: 'Navigate to console'
      },
      {
        id: 'go-to-settings',
        label: 'Go to Settings',
        category: 'Navigation',
        action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'settings' } })),
        description: 'Navigate to settings'
      },

      {
        id: 'tool-dex',
        label: 'Dex Explorer',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'dex' } })),
        description: 'Instance explorer for Roblox'
      },
      {
        id: 'tool-remote-spy',
        label: 'Remote Spy',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'remotespy' } })),
        description: 'Monitor RemoteEvents and RemoteFunctions'
      },
      {
        id: 'tool-simple-spy',
        label: 'Simple Spy',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'simplespy' } })),
        description: 'Lightweight remote logger'
      },
      {
        id: 'tool-infinity-yield',
        label: 'Infinity Yield',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'infinityyield' } })),
        description: 'FE admin commands'
      },
      {
        id: 'tool-dark-dex',
        label: 'Dark Dex',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'darkdex' } })),
        description: 'Alternative instance explorer'
      },
      {
        id: 'tool-hydroxide',
        label: 'Hydroxide',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'hydroxide' } })),
        description: 'Remote spy with upvalue editor'
      },
      {
        id: 'tool-secure-dex',
        label: 'Secure Dex',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'securedex' } })),
        description: 'Less detectable version of Dex'
      },
      {
        id: 'tool-sirius',
        label: 'Sirius Hub',
        category: 'Roblox Tools',
        action: () => window.dispatchEvent(new CustomEvent('execute-tool', { detail: { toolId: 'sirius' } })),
        description: 'Universal Script Hub'
      }
    ];
    
    let editorCommands = [];
    if (editor && monaco) {
      const editorActions = editor.getActions();
      editorCommands = editorActions
        .filter(action => {
          const importantPrefixes = [
            'editor.action.formatDocument',
            'editor.action.commentLine',
            'editor.action.selectAll',
            'editor.action.find',
            'editor.action.replace'
          ];
          return importantPrefixes.some(prefix => action.id.startsWith(prefix));
        })
        .map(action => ({
          id: action.id,
          label: action.label || action.id.replace(/^editor\./, '').split(/(?=[A-Z])/).join(' '),
          keybinding: getKeybindingLabel(monaco, action.id),
          category: 'Editor Actions',
          action: () => action.run(),
          description: 'Editor command'
        }));
    }
    
    const allCommands = [...commands, ...editorCommands].sort((a, b) => {
      if (a.category !== b.category) {
        const categoryOrder = {
          'Nocturnal Commands': 1,
          'Navigation': 2,
          'Roblox Tools': 3,
          'Editor Actions': 4
        };
        
        const aOrder = categoryOrder[a.category] || 999;
        const bOrder = categoryOrder[b.category] || 999;
        return aOrder - bOrder;
      }
      return a.label.localeCompare(b.label);
    });
    
    const categorized = allCommands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    }, {});
    
    setCommands(allCommands);
    setFilteredCommands(allCommands);
    setCategorizedCommands(categorized);
  }, [editor, monaco]);

  useEffect(() => {
    if (Object.keys(categorizedCommands).length > 0) {
      setVisibleCategories(Object.keys(categorizedCommands));
      setActiveCategoryIndex(0);
    } else {
      setVisibleCategories([]);
    }
  }, [categorizedCommands]);
  
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredCommands(commands);
      setSelectedIndex(0);
      return;
    }
    
    if (query.trim().toLowerCase().startsWith('tab:')) {
      const tabNumberStr = query.trim().substring(4).trim();
      const tabNumber = parseInt(tabNumberStr, 10);
      
      if (!isNaN(tabNumber) && tabNumber > 0) {
        const tabCommand = {
          id: `go-to-tab-${tabNumber}`,
          label: `Go to Tab ${tabNumber}`,
          category: 'Tab Navigation',
          action: () => handleTabNumberCommand(tabNumber),
          description: `Switch to the tab at position ${tabNumber}`
        };
        
        setFilteredCommands([tabCommand]);
        setSelectedIndex(0);
        
        setCategorizedCommands({
          'Tab Navigation': [tabCommand]
        });
        
        return;
      }
    }

    if (query.trim().toLowerCase().startsWith('docs:')) {
      const searchQuery = query.substring(5).trim();
      const docsCommand = {
        id: 'search-docs',
        label: `Search Documentation for "${searchQuery}"`,
        category: 'Documentation Search',
        action: () => {
          window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'docs' } }));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('docs-search', { detail: { query: searchQuery } }));
            setIsVisible(false);
          }, 100);
        },
        description: `Search documentation for "${searchQuery}"`
      };
      
      setFilteredCommands([docsCommand]);
      setSelectedIndex(0);
      setCategorizedCommands({
        'Documentation Search': [docsCommand]
      });
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = commands.filter(cmd => {
      const lowerLabel = cmd.label.toLowerCase();
      const lowerCategory = cmd.category.toLowerCase();
      const lowerDescription = cmd.description?.toLowerCase() || '';
      return lowerLabel.includes(lowerQuery) || 
             lowerCategory.includes(lowerQuery) || 
             lowerDescription.includes(lowerQuery);
    });
    
    setFilteredCommands(filtered);
    setSelectedIndex(0);

    const categorized = filtered.reduce((acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    }, {});
    
    setCategorizedCommands(categorized);
  }, [query, commands]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isVisible]);

  useEffect(() => {
    if (!commandListRef.current) return;
    
    const selectedElement = commandListRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation(); 
    }

    switch (e.key) {
      case 'ArrowDown':
        setSelectedIndex(prevIndex => {
          return prevIndex < filteredCommands.length - 1 ? prevIndex + 1 : prevIndex;
        });
        break;
        
      case 'ArrowUp':
        setSelectedIndex(prevIndex => {
          return prevIndex > 0 ? prevIndex - 1 : 0;
        });
        break;
        
      case 'Enter':
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setIsVisible(false);
        break;
        
      case 'Tab':
        e.preventDefault();
        break;
        
      case 'ArrowRight':
        navigateToNextCategory(false);
        break;
        
      case 'ArrowLeft':
        navigateToNextCategory(true);
        break;
    }
  };

  const navigateToNextCategory = (reverse = false) => {
    if (visibleCategories.length <= 1) return;
    
    const currentCommand = filteredCommands[selectedIndex];
    if (!currentCommand) return;
    
    const currentCategoryIndex = visibleCategories.indexOf(currentCommand.category);
    if (currentCategoryIndex === -1) return;
    
    const nextCategoryIndex = reverse
      ? (currentCategoryIndex - 1 + visibleCategories.length) % visibleCategories.length
      : (currentCategoryIndex + 1) % visibleCategories.length;
      
    const nextCategory = visibleCategories[nextCategoryIndex];
    setActiveCategoryIndex(nextCategoryIndex);
    
    const nextCategoryCommands = categorizedCommands[nextCategory];
    if (nextCategoryCommands && nextCategoryCommands.length > 0) {
      const nextCommandIndex = filteredCommands.indexOf(nextCategoryCommands[0]);
      if (nextCommandIndex >= 0) {
        setSelectedIndex(nextCommandIndex);
      }
    }
  };

  const executeCommand = (command) => {
    setIsVisible(false);
    setTimeout(() => {
      try {
        command.action();
      } catch (error) {
        console.error(error);
      }
    }, 10);
  };

  function getKeybindingLabel(monaco, commandId) {
    if (!monaco) return '';

    const knownKeybindings = {
      'editor.action.formatDocument': 'Shift+Alt+F',
      'editor.action.toggleWordWrap': 'Alt+Z',
      'editor.action.commentLine': 'Ctrl+/',
      'editor.action.findReferences': 'Shift+F12',
      'editor.action.rename': 'F2',
      'editor.action.quickFix': 'Ctrl+.',
    };
    
    return knownKeybindings[commandId] || '';
  }

  useEffect(() => {
    const handleGlobalEscape = (e) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleGlobalEscape);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalEscape);
    };
  }, [isVisible, setIsVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center"
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
          return;
        }
        
        if (e.target !== inputRef.current) {
          handleKeyDown(e);
        }
      }}
    >
      <div className="w-[550px] max-w-[calc(100vw-2rem)] bg-[#121212] rounded-xl overflow-hidden flex flex-col shadow-2xl border border-[#333333]">
        <div className="p-3">
          <div className="relative flex items-center">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-white pl-10 pr-3 py-3 focus:outline-none text-sm border-0"
              placeholder="Search commands..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation();
                handleKeyDown(e);
              }}
              aria-label="Search commands"
              autoComplete="off"
              spellCheck="false"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none'
              }}
            />
          </div>
        </div>
        
        <div 
          ref={commandListRef}
          className="max-h-[350px] overflow-y-auto command-palette-scrollbar"
          tabIndex="-1"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#777777]">
              No commands found
            </div>
          ) : (
            Object.entries(categorizedCommands).map(([category, categoryCommands], categoryIndex) => (
              <div key={category} className="command-category border-b border-[#333333] last:border-b-0">
                <div className={`px-3 py-1.5 text-xs text-[#888888] font-medium uppercase sticky top-0 z-10 transition-colors flex justify-between items-center border-b border-[#333333] ${
                  categoryIndex === activeCategoryIndex ? 'bg-[#252525]' : 'bg-[#1a1a1a]'
                }`}>
                  <span>{category}</span>
                </div>
                {categoryCommands.map(command => {
                  const commandIndex = filteredCommands.indexOf(command);
                  return (
                    <div
                      key={command.id}
                      data-index={commandIndex}
                      className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors border-b border-[#222222] last:border-b-0 ${
                        commandIndex === selectedIndex ? 'bg-[#252525]' : 'hover:bg-[#1a1a1a]'
                      }`}
                      onClick={() => executeCommand(command)}
                      role="option"
                      aria-selected={commandIndex === selectedIndex}
                    >
                      <div className="flex flex-col min-w-0 flex-grow">
                        <span className={`text-sm truncate ${commandIndex === selectedIndex ? 'text-white' : 'text-[#bbbbbb]'}`}>
                          {command.label}
                        </span>
                        {command.description && (
                          <span className="text-xs text-[#777777] truncate mt-0.5">
                            {command.description}
                          </span>
                        )}
                      </div>
                      {command.keybinding && (
                        <span className="text-xs text-[#888888] ml-2 flex-shrink-0 opacity-70 bg-[#252525] px-1.5 py-0.5 rounded">
                          {command.keybinding}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        <div className="px-3 py-2 text-xs text-[#777777] border-t border-[#333333] flex items-center justify-between bg-[#1a1a1a]">
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <span className="px-1 bg-[#252525] rounded">↑</span>
              <span className="px-1 bg-[#252525] rounded">↓</span>
              <span className="ml-1 opacity-60">navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1 bg-[#252525] rounded">←</span>
              <span className="px-1 bg-[#252525] rounded">→</span>
              <span className="ml-1 opacity-60">categories</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1 bg-[#252525] rounded">Enter</span>
              <span className="ml-1 opacity-60">select</span>
            </div>
          </div>
          <div className="text-[10px] opacity-60">
            {filteredCommands.length} {filteredCommands.length === 1 ? 'command' : 'commands'}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .command-palette-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .command-palette-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .command-palette-scrollbar::-webkit-scrollbar-thumb {
          background: #444444;
          border-radius: 4px;
        }
        
        .command-palette-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555555;
        }
      `}</style>
    </div>
  );
}
