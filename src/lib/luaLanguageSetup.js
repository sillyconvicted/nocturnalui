export function setupLuaLanguage(monaco) {
  if (monaco.__luaSetupComplete) {
    return;
  }
  
  const allCompletions = [
    ...executorFunctions,
    ...robloxApis,
  ];

  if (!monaco.languages.getLanguages().some(lang => lang.id === 'lua')) {
    monaco.languages.register({ id: 'lua' });
  }

  monaco.languages.setMonarchTokensProvider('lua', {
    defaultToken: 'invalid',
    keywords: [
      'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 
      'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 
      'until', 'while'
    ],
    builtins: [
      'print', 'error', 'warn', 'assert', 'pcall', 'xpcall', 'select',
      'tonumber', 'tostring', 'type', 'unpack', '_G', 'getfenv', 'setfenv',
      'next', 'pairs', 'ipairs', 'rawequal', 'rawset', 'rawget', 'collectgarbage',
      'getmetatable', 'setmetatable', 'require', 'loadstring', 'dofile', 'typeof',
      'string.byte', 'string.char', 'string.dump', 'string.find', 'string.format',
      'string.gsub', 'string.len', 'string.lower', 'string.match', 'string.rep',
      'string.reverse', 'string.sub', 'string.upper',
      'table.concat', 'table.insert', 'table.maxn', 'table.remove', 'table.sort',
      'table.create', 'table.find', 'table.move', 'table.foreach',
      'math.abs', 'math.acos', 'math.asin', 'math.atan', 'math.atan2', 'math.ceil',
      'math.cos', 'math.cosh', 'math.deg', 'math.exp', 'math.floor', 'math.fmod',
      'math.frexp', 'math.huge', 'math.ldexp', 'math.log', 'math.log10', 'math.max', 
      'math.min', 'math.modf', 'math.pi', 'math.pow', 'math.rad', 'math.random',
      'math.randomseed', 'math.sin', 'math.sinh', 'math.sqrt', 'math.tan', 'math.tanh',
      'io.close', 'io.flush', 'io.input', 'io.lines', 'io.open', 'io.output',
      'io.popen', 'io.read', 'io.tmpfile', 'io.type', 'io.write',
      'os.clock', 'os.date', 'os.difftime', 'os.execute', 'os.exit', 'os.getenv',
      'os.remove', 'os.rename', 'os.setlocale', 'os.time', 'os.tmpname'
    ],
    robloxGlobals: [
      '_G', 
      'game', 'workspace', 'script', 'math', 'string', 'table', 'task', 'wait',
      'delay', 'spawn', 'tick', 'Vector2', 'Vector3', 'CFrame', 'Color3',
      'Enum', 'Instance', 'Ray', 'Region3', 'UDim', 'UDim2', 'Rect', 'BrickColor',
      'TweenInfo', 'NumberSequence', 'ColorSequence', 'NumberRange', 'Path'
    ],
    executorFunctions: [
      'getgenv', 'getrenv', 'getrawmetatable', 'setrawmetatable', 'hookfunction',
      'hookmetamethod', 'islclosure', 'iscclosure', 'newcclosure', 'checkcaller',
      'getupvalue', 'setupvalue', 'getupvalues', 'getconstants', 'setconstant',
      'getnamecallmethod', 'setnamecallmethod', 'isexecutorclosure', 'identifyexecutor',
      'setreadonly', 'getscripts', 'loadstring', 'firesignal', 'gethui', 'hookamethod',
      'fireclickdetector', 'fireproximityprompt', 'firetouchinterest', 'fireremote',
      'readfile', 'writefile', 'appendfile', 'loadfile', 'listfiles', 'isfile', 'isfolder',
      'makefolder', 'delfolder', 'delfile',
      'debug.getregistry', 'debug.getupvalues', 'debug.getmetatable', 'debug.setmetatable',
      'debug.getconstants', 'debug.setconstant', 'debug.getupvalue', 'debug.setupvalue',
      'debug.getprotos', 'debug.getinfo', 'debug.traceback',
      'Drawing.new', 'Drawing.Clear', 'Drawing.isDrawing'
    ],   
    deprecatedFunctions: [
      'fluxus', 'fluxus.request', 'fluxus.set_thread_identity', 'fluxus.queue_on_teleport'
    ],
    constants: [
      'nil', 'true', 'false', 'self'
    ],
    operators: [
      '=', '~=', '==', '>', '>=', '<', '<=', '+', '-', '*', '/', '%', '^', '#',
      '..', '.', ':', '+'
    ],
    symbols: /[=><!~?:&|+\-*\/\^%#\.]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [/(fluxus)(\.)([a-zA-Z_]\w*)/, ['deprecated', 'delimiter', 'deprecated']], 
        [/\b(fluxus)\b/, 'deprecated'],
        [/[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*/, {
          cases: {
            '@deprecatedFunctions': 'deprecated',
            '@constants': 'constant',
            '@keywords': 'keyword',
            '@builtins': 'predefined',
            '@robloxGlobals': 'roblox',
            '@executorFunctions': 'executor',
            '@default': 'identifier'
          }
        }],
        { include: '@whitespace' },
        [/[{}()\[\]]/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }],
        [/0[xX][0-9a-fA-F_]+/, 'number.hex'],
        [/0[bB][01_]+/, 'number.binary'],
        [/\d+[eE][\-+]?\d+/, 'number.float'],
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/\d+[lL]?/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/\[(=*)\[/, { token: 'delimiter.longstring.start', next: '@longstring.$1' }],
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/--\[(=*)\[/, { token: 'comment.longcomment', next: '@longcomment.$1' }],
        [/--.*$/, 'comment'],
      ],
      longstring: [
        [/\](=*)\]/, {
          cases: {
            '$1==$S2': { token: 'delimiter.longstring.end', next: '@pop' },
            '@default': 'string'
          }
        }],
        [/./, 'string']
      ],
      longcomment: [
        [/\](=*)\]/, {
          cases: {
            '$1==$S2': { token: 'comment.longcomment', next: '@pop' },
            '@default': 'comment'
          }
        }],
        [/./, 'comment']
      ],
      string_double: [
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
        [/[^\\"]+/, 'string'],
      ],
      string_single: [
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
        [/[^\\']+/, 'string'],
      ]
    }
  });
  monaco.languages.setLanguageConfiguration('lua', {
    comments: {
      lineComment: '--',
      blockComment: ['--[[', ']]']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    indentationRules: {
      increaseIndentPattern: /^\s*(function|then|do|repeat|else|elseif|local\s+function|if)\s*$/,
      decreaseIndentPattern: /^\s*(end|until)\s*$/
    },
    folding: {
      markers: {
        start: new RegExp('^\\s*--\\s*#?region\\b'),
        end: new RegExp('^\\s*--\\s*#?endregion\\b')
      }
    },
    onEnterRules: []
  });

  const luaKeywords = [
    { label: 'if', insertText: 'if ${1:condition} then\n\t${2:-- code}\nend', kind: 17 /* Keyword */ },
    { label: 'for', insertText: 'for ${1:i} = ${2:1}, ${3:10}, ${4:1} do\n\t${5:-- code}\nend', kind: 17 },
    { label: 'while', insertText: 'while ${1:condition} do\n\t${2:-- code}\nend', kind: 17 },
    { label: 'repeat', insertText: 'repeat\n\t${1:-- code}\nuntil ${2:condition}', kind: 17 },
    { label: 'function', insertText: 'function ${1:name}(${2:params})\n\t${3:-- code}\nend', kind: 17 },
    { label: 'local', insertText: 'local ${1:name} = ${2:value}', kind: 17 },
    { label: 'local function', insertText: 'local function ${1:name}(${2:params})\n\t${3:-- code}\nend', kind: 17 },
    { label: 'return', insertText: 'return ${1:value}', kind: 17 },
    { label: 'elseif', insertText: 'elseif ${1:condition} then\n\t${2:-- code}', kind: 17 },
    { label: 'else', insertText: 'else\n\t${1:-- code}', kind: 17 },
    { label: 'and', insertText: 'and ', kind: 17 },
    { label: 'or', insertText: 'or ', kind: 17 },
    { label: 'not', insertText: 'not ', kind: 17 },
    { label: 'nil', insertText: 'nil', kind: 17 },
    { label: 'true', insertText: 'true', kind: 17 },
    { label: 'false', insertText: 'false', kind: 17 },
    { label: 'self', insertText: 'self', kind: 17 },
  ];

  allCompletions.push(...luaKeywords);

  monaco.languages.registerCompletionItemProvider('lua', {
    triggerCharacters: ['.', ':', '_'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const lineUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      
      const lastChar = lineUntilPosition.trim().slice(-1);
      
      const createSuggestion = (item) => {
        const itemKind = item.kind || 1; 
        const isMethod = itemKind === 2;
        const isKeyword = itemKind === 17;
        
        let iconClasses = '';
        if (isMethod) {
          iconClasses = 'method-icon'; 
        } else if (isKeyword) {
          iconClasses = 'keyword-icon'; 
        } else {
          iconClasses = 'function-icon';
        }

        const styleElement = document.getElementById('monaco-suggestion-styles');
        if (!styleElement) {
          const newStyleElement = document.createElement('style');
          newStyleElement.id = 'monaco-suggestion-styles';
          newStyleElement.innerHTML = `
            .function-icon:before { content: 'ƒ'; color: #569CD6; font-weight: bold; }
            .method-icon:before { content: 'M'; color: #4EC9B0; font-weight: bold; }
            .keyword-icon:before { content: 'K'; color: #C586C0; font-weight: bold; }
          `;
          document.head.appendChild(newStyleElement);
        }
        
        return {
          label: item.label,
          kind: isMethod 
            ? monaco.languages.CompletionItemKind.Method 
            : isKeyword 
              ? monaco.languages.CompletionItemKind.Keyword 
              : monaco.languages.CompletionItemKind.Function,
          documentation: {
            value: item.documentation || ''
          },
          detail: item.detail || '',
          insertText: item.insertText || item.label,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: range,
          sortText: isMethod ? '2' : isKeyword ? '3' : '1', 
          filterText: item.label,
          command: { id: 'editor.action.triggerSuggest' }
        };
      };
      
      if (lastChar === ':') {
        return {
          suggestions: allCompletions
            .filter(item => item.kind === 2) 
            .map(item => {
              const label = item.label.includes(':') ? item.label.split(':')[1] : item.label;
              const insertText = item.insertText.startsWith(':') ? item.insertText : `:${item.insertText}`;
              
              return createSuggestion({
                ...item,
                label,
                insertText,
                kind: 2
              });
            })
        };
      } else if (lastChar === '.') {
        return {
          suggestions: allCompletions
            .filter(item => item.label.includes('.'))
            .map(item => {
              const label = item.label.split('.').pop();
              const insertText = item.insertText.includes('.') 
                ? item.insertText.split('.').pop() 
                : item.insertText;
              
              return createSuggestion({
                ...item,
                label,
                insertText,
                kind: 1 
              });
            })
        };
      }
      
      return {
        suggestions: allCompletions.map(item => createSuggestion(item))
      };
    }
  });

  monaco.languages.registerHoverProvider('lua', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const match = allCompletions.find(item => 
        item.label === word.word || 
        item.label.includes(`.${word.word}`) || 
        item.label.includes(`:${word.word}`)
      );

      if (match) {
        return {
          contents: [
            { value: '```lua\n' + match.detail + '\n```' },
            { value: match.documentation }
          ]
        };
      }
      return null;
    }
  });

  monaco.editor.defineTheme('lua-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
      { token: 'predefined', foreground: '569CD6' },
      { token: 'roblox', foreground: '4EC9B0' },       
      { token: 'executor', foreground: '4FC1FF' },     
      { token: 'constant', foreground: '569CD6', fontStyle: 'bold' }, 
      { token: 'identifier', foreground: 'D4D4D4' },  
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'string', foreground: 'CE9178' },       
      { token: 'string.escape', foreground: 'D7BA7D' }, 
      { token: 'number', foreground: 'B5CEA8' },       
      { token: 'number.hex', foreground: 'B5CEA8' },  
      { token: 'number.binary', foreground: 'B5CEA8' }, 
      { token: 'number.float', foreground: 'B5CEA8' }, 
      { token: 'operator', foreground: 'D4D4D4' },     
      { token: 'delimiter', foreground: 'D4D4D4' },  
      { 
        token: 'deprecated', 
        foreground: 'FF5252', 
        fontStyle: 'italic bold underline'
      }, 
      { token: '', foreground: 'D4D4D4' }
    ],
    colors: {
      'editor.foreground': '#D4D4D4',  
      'editor.background': '#121212',
      'editor.selectionBackground': '#264F78',
      'editor.lineHighlightBackground': '#2A2A2A',
      'editorCursor.foreground': '#FFFFFF',
      'editorWhitespace.foreground': '#404040',
      'editorLineNumber.foreground': '#858585',
      'editorSuggestWidget.background': '#252526',
      'editorSuggestWidget.foreground': '#D4D4D4',
      'editorSuggestWidget.selectedBackground': '#062F4A'
    }
  });

  monaco.editor.setTheme('lua-dark');

  monaco.languages.registerDocumentSemanticTokensProvider('lua', {
    getLegend: () => ({
      tokenTypes: ['variable', 'function'],
      tokenModifiers: ['declaration', 'usage']
    }),
    provideDocumentSemanticTokens: (model) => {
      const lines = model.getLinesContent();
      const tokens = [];
      const localDeclarations = new Map();
      const functionDeclarations = new Set();
      
      lines.forEach((line, lineIndex) => {
        const localMatches = line.matchAll(/\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g);
        for (const match of localMatches) {
          localDeclarations.set(match[1], true);
        }
        
        const functionMatches = line.matchAll(/\b(?:local\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
        for (const match of functionMatches) {
          functionDeclarations.add(match[1]);
        }
      });

      lines.forEach((line, lineIndex) => {
        const variableMatches = line.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*[=\(])/g);
        for (const match of variableMatches) {
          const varName = match[1];
          if (!localDeclarations.has(varName) && 
              !functionDeclarations.has(varName) && 
              !robloxApis.some(api => api.label === varName) &&
              !executorFunctions.some(func => func.label === varName) &&
              !['print', 'warn', 'error', '_G', 'game', 'workspace', 'script'].includes(varName)) {
            
            monaco.editor.setModelMarkers(model, 'lua', [{
              message: `Variable '${varName}' is not defined`,
              severity: monaco.MarkerSeverity.Warning,
              startLineNumber: lineIndex + 1,
              startColumn: match.index + 1,
              endLineNumber: lineIndex + 1,
              endColumn: match.index + match[0].length + 1
            }]);
          }
        }
        
        const functionMatches = line.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
        for (const match of functionMatches) {
          const funcName = match[1];
          if (!functionDeclarations.has(funcName) && 
              !robloxApis.some(api => api.label === funcName) &&
              !executorFunctions.some(func => func.label === funcName)) {
            
            monaco.editor.setModelMarkers(model, 'lua', [{
              message: `Function '${funcName}' is not defined`,
              severity: monaco.MarkerSeverity.Warning,
              startLineNumber: lineIndex + 1,
              startColumn: match.index + 1,
              endLineNumber: lineIndex + 1,
              endColumn: match.index + match[0].length + 1
            }]);
          }
        }
      });

      return { data: new Uint32Array(tokens) };
    },
    releaseDocumentSemanticTokens: () => {}
  });

  monaco.editor.onDidCreateModel(model => {
    if (model.getLanguageId() === 'lua') {
      model.onDidChangeContent(() => {
        monaco.languages.semanticTokens.refresh();
      });
    }
  });
  
  monaco.__luaSetupComplete = true;
}

export const executorFunctions = [
  {
    label: 'getgenv',
    kind: 1,
    detail: 'getgenv()',
    documentation: 'Returns the global environment table for the exploit environment. Similar to _G but persists across scripts and has special properties.',
    insertText: 'getgenv()',
  },
  {
    label: 'getrenv',
    kind: 1,
    detail: 'getrenv()',
    documentation: 'Returns the current game\'s environment table.',
    insertText: 'getrenv()',
  },
  {
    label: 'getrawmetatable',
    kind: 1,
    detail: 'getrawmetatable(object)',
    documentation: 'Returns the metatable of an object, bypassing __metatable protection.',
    insertText: 'getrawmetatable(${1:object})',
  },
  {
    label: 'setclipboard',
    kind: 1,
    detail: 'setclipboard(text)',
    documentation: 'Copies text to the clipboard.',
    insertText: 'setclipboard(${1:text})',
  },
  {
    label: 'identifyexecutor',
    kind: 1,
    detail: 'identifyexecutor()',
    documentation: 'Returns the name and version of the current executor.',
    insertText: 'identifyexecutor()',
  },
  {
    label: 'getsenv',
    kind: 1,
    detail: 'getsenv(script)',
    documentation: 'Returns the environment of the specified script.',
    insertText: 'getsenv(${1:script})',
  },
  {
    label: 'getfpscap',
    kind: 1,
    detail: 'getfpscap()',
    documentation: 'Returns the current FPS cap.',
    insertText: 'getfpscap()',
  },
  {
    label: 'setfpscap',
    kind: 1,
    detail: 'setfpscap(fps)',
    documentation: 'Sets the FPS cap.',
    insertText: 'setfpscap(${1:fps})',
  },
  {
    label: 'getcustomasset',
    kind: 1,
    detail: 'getcustomasset(path)',
    documentation: 'Converts a file path to a usable Roblox asset ID.',
    insertText: 'getcustomasset("${1:path}")',
  },
  {
    label: 'getconnections',
    kind: 1,
    detail: 'getconnections(signal)',
    documentation: 'Returns all connections to a specified signal/event.',
    insertText: 'getconnections(${1:signal})',
  },
  {
    label: 'fireclickdetector',
    kind: 1,
    detail: 'fireclickdetector(clickDetector, distance)',
    documentation: 'Simulates a click on a ClickDetector.',
    insertText: 'fireclickdetector(${1:clickDetector}${2:, distance})',
  },
  {
    label: 'iscclosure',
    kind: 1,
    detail: 'iscclosure(function)',
    documentation: 'Checks if the given function is a C closure.',
    insertText: 'iscclosure(${1:function})',
  },
  {
    label: 'islclosure',
    kind: 1,
    detail: 'islclosure(function)',
    documentation: 'Checks if the given function is a Lua closure.',
    insertText: 'islclosure(${1:function})',
  },
  {
    label: 'isexecutorclosure',
    kind: 1,
    detail: 'isexecutorclosure(function)',
    documentation: 'Checks if the given function is an executor-level closure.',
    insertText: 'isexecutorclosure(${1:function})',
  },
  {
    label: 'identifyexecutor',
    kind: 1,
    detail: 'identifyexecutor()',
    documentation: 'Returns the name and version of the current executor.',
    insertText: 'identifyexecutor()',
  },
  {
    label: 'setreadonly',
    kind: 1,
    detail: 'setreadonly(table, readonly)',
    documentation: 'Sets whether a table is read-only.',
    insertText: 'setreadonly(${1:table}, ${2:readonly})',
  },
  {
    label: 'getscripts',
    kind: 1,
    detail: 'getscripts()',
    documentation: 'Returns a table of all scripts in the game.',
    insertText: 'getscripts()',
  },
  {
    label: 'hookfunction',
    kind: 1,
    detail: 'hookfunction(original, hook)',
    documentation: 'Replaces a function with another function while preserving original call capability.',
    insertText: 'hookfunction(${1:original}, ${2:hook})',
  },
  {
    label: 'loadstring',
    kind: 1,
    detail: 'loadstring(code, chunkname)',
    documentation: 'Compiles the given string of Lua code and returns it as a function.',
    insertText: 'loadstring(${1:code}${2:, chunkname})',
  },
  {
    label: 'firesignal',
    kind: 1,
    detail: 'firesignal(signal, ...)',
    documentation: 'Fires a signal with the provided arguments.',
    insertText: 'firesignal(${1:signal}${2:, ...})',
  },
  {
    label: 'gethui',
    kind: 1,
    detail: 'gethui()',
    documentation: 'Returns the hidden UI container that can be used to create persistent GUIs.',
    insertText: 'gethui()',
  },
  {
    label: 'hookamethod',
    kind: 1,
    detail: 'hookamethod(object, methodName, hook)',
    documentation: 'Hooks a method of an object with a custom function.',
    insertText: 'hookamethod(${1:object}, "${2:methodName}", ${3:hook})',
  },
  {
    label: 'syn.request',
    kind: 1,
    detail: 'syn.request(options)',
    documentation: 'Makes an HTTP request with options like Url, Method, Headers, and Body.',
    insertText: 'syn.request({\n\tUrl = "${1:url}",\n\tMethod = "${2|GET,POST,HEAD,PUT,DELETE|}",\n\tHeaders = ${3:{}},\n\tBody = ${4:nil}\n})',
  },
  {
    label: 'http.request',
    kind: 1,
    detail: 'http.request(options)',
    documentation: 'Alternative HTTP request function supported by various executors.',
    insertText: 'http.request({\n\tUrl = "${1:url}",\n\tMethod = "${2|GET,POST,HEAD,PUT,DELETE|}",\n\tHeaders = ${3:{}},\n\tBody = ${4:nil}\n})',
  },
  {
    label: 'replicatesignal',
    kind: 1,
    detail: 'replicatesignal(signal, ...)',
    documentation: 'Replicates a signal to the server with given arguments.',
    insertText: 'replicatesignal(${1:signal}${2:, ...})',
  },
  {
    label: 'setrenderproperty',
    kind: 1,
    detail: 'setrenderproperty(obj, property, value)',
    documentation: 'Sets a render property of an instance.',
    insertText: 'setrenderproperty(${1:instance}, "${2:property}", ${3:value})',
  },
  {
    label: 'setthreadidentity',
    kind: 1,
    detail: 'setthreadidentity(identity)',
    documentation: 'Sets the identity/security context of the current thread.',
    insertText: 'setthreadidentity(${1:identity})',
  },
  {
    label: 'getthreadidentity',
    kind: 1,
    detail: 'getthreadidentity()',
    documentation: 'Gets the current thread identity level.',
    insertText: 'getthreadidentity()',
  },
  {
    label: 'sethiddenproperty',
    kind: 1,
    detail: 'sethiddenproperty(instance, property, value)',
    documentation: 'Sets a hidden property of an instance.',
    insertText: 'sethiddenproperty(${1:instance}, "${2:property}", ${3:value})',
  },
  {
    label: 'gethiddenproperty',
    kind: 1,
    detail: 'gethiddenproperty(instance, property)',
    documentation: 'Gets a hidden property value from an instance.',
    insertText: 'gethiddenproperty(${1:instance}, "${2:property}")',
  },
  {
    label: 'fluxus.request',
    kind: 1,
    detail: '[DEPRECATED] fluxus.request(options)',
    documentation: '⚠️ Not Recommended: Use syn.request() or http.request() instead.\nMakes an HTTP request using Fluxus API.',
    insertText: 'fluxus.request({\n\tUrl = "${1:url}",\n\tMethod = "${2|GET,POST,HEAD,PUT,DELETE|}",\n\tHeaders = ${3:{}},\n\tBody = ${4:nil}\n})',
    deprecated: true
  },
  {
    label: 'fluxus.set_thread_identity',
    kind: 1,
    detail: '[DEPRECATED] fluxus.set_thread_identity(identity)',
    documentation: '⚠️ Not Recommended: Use setthreadidentity() instead.\nSets the identity/security context of the current thread.',
    insertText: 'fluxus.set_thread_identity(${1:identity})',
    deprecated: true
  },
  {
    label: 'fluxus.queue_on_teleport',
    kind: 1,
    detail: '[DEPRECATED] fluxus.queue_on_teleport(script)',
    documentation: '⚠️ Not Recommended: Use queue_on_teleport() or syn.queue_on_teleport() instead.\nQueues a script to run when the player teleports.',
    insertText: 'fluxus.queue_on_teleport([[${1:script}]])',
    deprecated: true
  },
  {
    label: 'isrbxactive',
    kind: 1,
    detail: 'isrbxactive()',
    documentation: 'Checks if the Roblox window is currently active/focused.',
    insertText: 'isrbxactive()',
  },
  {
    label: 'mousemoveabs',
    kind: 1,
    detail: 'mousemoveabs(x, y)',
    documentation: 'Moves the mouse cursor to absolute screen coordinates.',
    insertText: 'mousemoveabs(${1:x}, ${2:y})',
  },
  {
    label: 'getgc',
    kind: 1,
    detail: 'getgc()',
    documentation: 'Returns a table of all Lua objects in garbage collection.',
    insertText: 'getgc()',
  },
  {
    label: 'rconsoleclear',
    kind: 1,
    detail: 'rconsoleclear()',
    documentation: 'Clears the remote console output.',
    insertText: 'rconsoleclear()',
  },
  {
    label: 'rconsolecreate',
    kind: 1,
    detail: 'rconsolecreate()',
    documentation: 'Creates a new remote console window.',
    insertText: 'rconsolecreate()',
  },
  {
    label: 'rconsoledestroy',
    kind: 1,
    detail: 'rconsoledestroy()',
    documentation: 'Destroys the remote console window.',
    insertText: 'rconsoledestroy()',
  },
  {
    label: 'rconsoleinput',
    kind: 1,
    detail: 'rconsoleinput()',
    documentation: 'Gets input from the remote console. Returns the input as a string.',
    insertText: 'rconsoleinput()',
  },
  {
    label: 'rconsoleprint',
    kind: 1,
    detail: 'rconsoleprint(text)',
    documentation: 'Prints text to the remote console.',
    insertText: 'rconsoleprint(${1:text})',
  },
  {
    label: 'rconsolesettitle',
    kind: 1,
    detail: 'rconsolesettitle(title)',
    documentation: 'Sets the title of the remote console window.',
    insertText: 'rconsolesettitle("${1:title}")',
  },
  {
    label: 'WebSocket.connect',
    kind: 1,
    detail: 'WebSocket.connect(url)',
    documentation: 'Creates a new WebSocket connection to the specified URL.',
    insertText: 'WebSocket.connect("${1:url}")',
  },
  {
    label: 'checkcaller',
    kind: 1,
    detail: 'checkcaller()',
    documentation: 'Checks if the current thread is running in the executor context.',
    insertText: 'checkcaller()',
  },
  {
    label: 'clonefunction',
    kind: 1,
    detail: 'clonefunction(fn)',
    documentation: 'Creates a copy of the specified function.',
    insertText: 'clonefunction(${1:fn})',
  },
  {
    label: 'readfile',
    kind: 1,
    detail: 'readfile(path)',
    documentation: 'Reads the contents of a file in the workspace folder.',
    insertText: 'readfile("${1:path}")',
  },
  {
    label: 'listfiles',
    kind: 1,
    detail: 'listfiles(path)',
    documentation: 'Returns a table of all files in the specified directory.',
    insertText: 'listfiles("${1:path}")',
  },
  {
    label: 'writefile',
    kind: 1,
    detail: 'writefile(path, content)',
    documentation: 'Writes content to a file, creating it if it doesn\'t exist.',
    insertText: 'writefile("${1:path}", ${2:content})',
  },
  {
    label: 'makefolder',
    kind: 1,
    detail: 'makefolder(path)',
    documentation: 'Creates a new folder at the specified path.',
    insertText: 'makefolder("${1:path}")',
  },
  {
    label: 'appendfile',
    kind: 1,
    detail: 'appendfile(path, content)',
    documentation: 'Appends content to the end of a file.',
    insertText: 'appendfile("${1:path}", ${2:content})',
  },
  {
    label: 'isfile',
    kind: 1,
    detail: 'isfile(path)',
    documentation: 'Checks if a file exists at the specified path.',
    insertText: 'isfile("${1:path}")',
  },
  {
    label: 'isfolder',
    kind: 1,
    detail: 'isfolder(path)',
    documentation: 'Checks if a folder exists at the specified path.',
    insertText: 'isfolder("${1:path}")',
  },
  {
    label: 'delfile',
    kind: 1,
    detail: 'delfile(path)',
    documentation: 'Deletes the file at the specified path.',
    insertText: 'delfile("${1:path}")',
  },
  {
    label: 'delfolder',
    kind: 1,
    detail: 'delfolder(path)',
    documentation: 'Deletes the folder at the specified path and all its contents.',
    insertText: 'delfolder("${1:path}")',
  },
  {
    label: 'loadfile',
    kind: 1,
    detail: 'loadfile(path)',
    documentation: 'Loads a Lua file and returns it as a function.',
    insertText: 'loadfile("${1:path}")',
  },
  {
    label: 'dofile',
    kind: 1,
    detail: 'dofile(path)',
    documentation: 'Loads and executes a Lua file.',
    insertText: 'dofile("${1:path}")',
  }
];

export const robloxApis = [
  {
    label: '_G',
    kind: 1,
    detail: '_G',
    documentation: 'Global table that stores all global variables in the current script context.',
    insertText: '_G',
  },
  {
    label: 'Instance.new',
    kind: 1,
    detail: 'Instance.new(className, parent)',
    documentation: 'Creates a new Instance of the specified class.',
    insertText: 'Instance.new("${1|Part,Model,Folder,Script,LocalScript,ScreenGui,Frame,TextLabel,TextButton,ImageLabel,Sound,Animation,RemoteEvent,RemoteFunction|}"${2:, parent})',
  },
  {
    label: 'FindFirstChild',
    kind: 2,
    detail: 'instance:FindFirstChild(name, recursive)',
    documentation: 'Searches for the first child of the instance with the given name.',
    insertText: ':FindFirstChild("${1:name}"${2:, recursive})',
  },
  {
    label: 'FindFirstChildOfClass',
    kind: 2,
    detail: 'instance:FindFirstChildOfClass(className)',
    documentation: 'Searches for the first child of the instance with the given class name.',
    insertText: ':FindFirstChildOfClass("${1:className}")',
  },
  {
    label: 'GetChildren',
    kind: 2,
    detail: 'instance:GetChildren()',
    documentation: 'Returns an array containing all of the instance\'s children.',
    insertText: ':GetChildren()',
  },
  {
    label: 'GetDescendants',
    kind: 2,
    detail: 'instance:GetDescendants()',
    documentation: 'Returns an array containing all of the instance\'s descendants.',
    insertText: ':GetDescendants()',
  },
  {
    label: 'Clone',
    kind: 2,
    detail: 'instance:Clone()',
    documentation: 'Creates a copy of the instance and all of its descendants.',
    insertText: ':Clone()',
  },
  {
    label: 'Destroy',
    kind: 2,
    detail: 'instance:Destroy()',
    documentation: 'Removes the instance from the game.',
    insertText: ':Destroy()',
  },
  {
    label: 'Connect',
    kind: 2,
    detail: 'event:Connect(function)',
    documentation: 'Connects a function to the event.',
    insertText: ':Connect(function(${1:...})\n\t${2:-- code}\nend)',
  },
  {
    label: 'game:GetService',
    kind: 2,
    detail: 'game:GetService(serviceName)',
    documentation: 'Returns the specified service.',
    insertText: 'game:GetService("${1|Players,Workspace,ReplicatedStorage,RunService,UserInputService,TweenService,HttpService,Lighting,SoundService,MarketplaceService,ContentProvider,PhysicsService,PathfindingService,MessagingService,GroupService,Chat,TextService,CoreGui,VRService,StarterPlayer,StarterGui,StarterPack,Teams,TestService,LogService,KeyframeSequenceProvider,MouseService,NotificationService,ReplicatedFirst,ScriptContext,Selection,InsertService,JointsService,Debris,SocialService,ContextActionService,AssetService,TouchInputService,BrowserService,GuiService,BadgeService,TerrainService,TeleportService,CollectionService|}")',
  },
  
  {
    label: 'Vector3.new',
    kind: 1,
    detail: 'Vector3.new(x, y, z)',
    documentation: 'Creates a new Vector3 with the given x, y, and z components.',
    insertText: 'Vector3.new(${1:x}, ${2:y}, ${3:z})',
  },
  {
    label: 'CFrame.new',
    kind: 1,
    detail: 'CFrame.new(x, y, z, ...)',
    documentation: 'Creates a new CFrame with the given position and orientation.',
    insertText: 'CFrame.new(${1:x}, ${2:y}, ${3:z})',
  },
  {
    label: 'CFrame.Angles',
    kind: 1,
    detail: 'CFrame.Angles(rx, ry, rz)',
    documentation: 'Creates a new CFrame rotated by the given angles.',
    insertText: 'CFrame.Angles(${1:rx}, ${2:ry}, ${3:rz})',
  },
  {
    label: 'CFrame.fromAxisAngle',
    kind: 1,
    detail: 'CFrame.fromAxisAngle(axis, angle)',
    documentation: 'Creates a new CFrame rotated around the given axis by the given angle.',
    insertText: 'CFrame.fromAxisAngle(${1:axis}, ${2:angle})',
  },
  
  {
    label: 'Color3.new',
    kind: 1,
    detail: 'Color3.new(r, g, b)',
    documentation: 'Creates a new Color3 with the given red, green, and blue components.',
    insertText: 'Color3.new(${1:r}, ${2:g}, ${3:b})',
  },
  {
    label: 'Color3.fromRGB',
    kind: 1,
    detail: 'Color3.fromRGB(r, g, b)',
    documentation: 'Creates a new Color3 from RGB values (0-255).',
    insertText: 'Color3.fromRGB(${1:r}, ${2:g}, ${3:b})',
  },
  {
    label: 'Color3.fromHSV',
    kind: 1,
    detail: 'Color3.fromHSV(h, s, v)',
    documentation: 'Creates a new Color3 from HSV values.',
    insertText: 'Color3.fromHSV(${1:h}, ${2:s}, ${3:v})',
  },
  {
    label: 'wait',
    kind: 1,
    detail: 'wait(seconds)',
    documentation: 'Yields the current thread for the given number of seconds.',
    insertText: 'wait(${1:seconds})',
  },
  {
    label: 'task.wait',
    kind: 1,
    detail: 'task.wait(seconds)',
    documentation: 'Improved version of wait() with better precision.',
    insertText: 'task.wait(${1:seconds})',
  },
  {
    label: 'task.spawn',
    kind: 1,
    detail: 'task.spawn(function, ...)',
    documentation: 'Runs the function in a separate thread with the given arguments.',
    insertText: 'task.spawn(function()\n\t${1:-- code}\nend)',
  },
  {
    label: 'task.delay',
    kind: 1,
    detail: 'task.delay(seconds, function, ...)',
    documentation: 'Runs the function after the given number of seconds.',
    insertText: 'task.delay(${1:seconds}, function()\n\t${2:-- code}\nend)',
  },
  {
    label: 'print',
    kind: 1,
    detail: 'print(...)',
    documentation: 'Prints the specified values to the output.',
    insertText: 'print(${1:...})',
  },
  {
    label: 'warn',
    kind: 1,
    detail: 'warn(...)',
    documentation: 'Prints a warning message to the output.',
    insertText: 'warn(${1:...})',
  },
  {
    label: 'error',
    kind: 1,
    detail: 'error(message, level)',
    documentation: 'Raises an error with the given message.',
    insertText: 'error(${1:message}${2:, level})',
  },
  {
    label: 'pcall',
    kind: 1,
    detail: 'pcall(function, ...)',
    documentation: 'Calls the function in protected mode, catching any errors that occur.',
    insertText: 'pcall(${1:function}${2:, ...})',
  },
  {
    label: 'typeof',
    kind: 1,
    detail: 'typeof(value)',
    documentation: 'Returns the Roblox-specific type of the value, using Roblox\'s extended type system.',
    insertText: 'typeof(${1:value})',
  },
  {
    label: 'tick',
    kind: 1,
    detail: 'tick()',
    documentation: 'Returns the current time in seconds since the UNIX epoch.',
    insertText: 'tick()',
  },
  {
    label: 'spawn',
    kind: 1,
    detail: 'spawn(function)',
    documentation: 'Creates a new thread to execute the given function (deprecated, use task.spawn instead).',
    insertText: 'spawn(${1:function})',
  },
  {
    label: 'delay',
    kind: 1,
    detail: 'delay(delayTime, function)',
    documentation: 'Schedules a function to be executed after the specified delay (deprecated, use task.delay instead).',
    insertText: 'delay(${1:delayTime}, ${2:function})',
  },
  {
    label: 'assert',
    kind: 1,
    detail: 'assert(condition, message)',
    documentation: 'Raises an error if the condition is false, with an optional message.',
    insertText: 'assert(${1:condition}${2:, message})',
  },
  {
    label: 'tostring',
    kind: 1,
    detail: 'tostring(value)',
    documentation: 'Converts the value to a string.',
    insertText: 'tostring(${1:value})',
  },
  {
    label: 'tonumber',
    kind: 1,
    detail: 'tonumber(value, base)',
    documentation: 'Converts the value to a number, with an optional base for string conversion.',
    insertText: 'tonumber(${1:value}${2:, base})',
  },
  {
    label: 'task.defer',
    kind: 1,
    detail: 'task.defer(callback, ...)',
    documentation: 'Defers the execution of a function to the next resumption cycle.',
    insertText: 'task.defer(function()\n\t${1:-- code}\nend)',
  },
  {
    label: 'task.synchronize',
    kind: 1,
    detail: 'task.synchronize()',
    documentation: 'Yields until all previous tasks are complete.',
    insertText: 'task.synchronize()',
  },
  {
    label: 'RaycastParams.new',
    kind: 1,
    detail: 'RaycastParams.new()',
    documentation: 'Creates a new RaycastParams object for configuring raycasts.',
    insertText: 'local params = RaycastParams.new()\nparams.FilterType = ${1|Enum.RaycastFilterType.Blacklist,Enum.RaycastFilterType.Whitelist|}\nparams.FilterDescendantsInstances = {${2:instances}}',
  },
  {
    label: 'workspace:Raycast',
    kind: 2,
    detail: 'workspace:Raycast(origin, direction, params)',
    documentation: 'Casts a ray through the workspace and returns hit information.',
    insertText: ':Raycast(${1:origin}, ${2:direction}, ${3:params})',
  },
  {
    label: 'TweenService:Create',
    kind: 2,
    detail: 'TweenService:Create(instance, tweenInfo, properties)',
    documentation: 'Creates a new tween for the specified instance.',
    insertText: ':Create(${1:instance}, TweenInfo.new(${2:time}, ${3:easingStyle}, ${4:easingDirection}), {${5:properties}})',
  },
  {
    label: 'RunService.Heartbeat:Connect',
    kind: 2,
    detail: 'RunService.Heartbeat:Connect(function)',
    documentation: 'Connects a function to run every heartbeat.',
    insertText: ':Connect(function(deltaTime)\n\t${1:-- code}\nend)',
  },
  {
    label: 'UserInputService.InputBegan:Connect',
    kind: 2,
    detail: 'UserInputService.InputBegan:Connect(function)',
    documentation: 'Connects a function to handle input beginning.',
    insertText: ':Connect(function(input, gameProcessed)\n\tif input.KeyCode == ${1:Enum.KeyCode.Key} then\n\t\t${2:-- code}\n\tend\nend)',
  },
  {
    label: 'mouse1click',
    kind: 1,
    detail: 'mouse1click()',
    documentation: 'Simulates a left mouse button click.',
    insertText: 'mouse1click()',
  },
  {
    label: 'mouse2click',
    kind: 1,
    detail: 'mouse2click()',
    documentation: 'Simulates a right mouse button click.',
    insertText: 'mouse2click()',
  },
  {
    label: 'mousemoverel',
    kind: 1,
    detail: 'mousemoverel(x, y)',
    documentation: 'Moves the mouse cursor relative to its current position.',
    insertText: 'mousemoverel(${1:x}, ${2:y})',
  },
  {
    label: 'mousemoveabs',
    kind: 1,
    detail: 'mousemoveabs(x, y)',
    documentation: 'Moves the mouse cursor to absolute screen coordinates.',
    insertText: 'mousemoveabs(${1:x}, ${2:y})',
  }
];

export default setupLuaLanguage;
