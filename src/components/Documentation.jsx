import { useState } from 'react';
import { executorFunctions, robloxApis } from '../lib/luaLanguageSetup';

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState('');

  const sections = [
    {
      id: 'executor',
      title: 'Executor Functions',
      description: 'Core functions provided by the executor environment',
      items: executorFunctions.filter(f => !f.deprecated)
    },
    {
      id: 'roblox',
      title: 'Roblox APIs',
      description: 'Built-in Roblox functions and interfaces',
      items: robloxApis
    },
    {
      id: 'deprecated',
      title: 'Deprecated Functions',
      description: 'Functions that should be avoided or replaced with alternatives',
      items: executorFunctions.filter(f => f.deprecated)
    }
  ];

  const filterItems = (items) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderFunctionCard = (item) => (
    <div key={item.label} className="space-y-4 py-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-medium ${item.deprecated ? 'text-red-400' : 'text-[#4FC1FF]'}`}>
              {item.label}
            </span>
            {item.deprecated && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/20">
                Deprecated
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {item.detail}
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-300 pl-4 border-l-2 border-[#333] whitespace-pre-wrap">
        {item.documentation}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#0e0e0e] overflow-y-auto py-6">
      <div className="max-w-3xl w-full mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold font-display">Documentation</h1>
          <p className="text-sm text-gray-400">
            Reference guide for available functions and APIs
          </p>
        </div>

        <div className="sticky top-0 bg-[#0e0e0e] py-4 z-10 mb-8">
          <input
            type="text"
            placeholder="Search functions..."
            className="w-full px-4 py-2 bg-[#131313] border border-gray-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-12">
          {sections.map(section => {
            const filteredItems = filterItems(section.items);
            if (filteredItems.length === 0) return null;
            
            return (
              <div key={section.id} className="mb-8">
                <h2 className="text-lg font-medium mb-4 pb-2 border-b border-white/20">
                  {section.title}
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                  {section.description}
                </p>
                <div className="space-y-1 divide-y divide-[#222]">
                  {filteredItems.map(renderFunctionCard)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
