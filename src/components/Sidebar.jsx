"use client";

import { useState, useRef, useEffect } from "react";

export default function Sidebar({ items, activeItem, setActiveItem }) {
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, 
    x: 0, 
    y: 0,
    animation: false
  });
  const contextMenuRef = useRef(null);
  
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ ...contextMenu, visible: false, animation: false });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false, animation: false });
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [contextMenu.visible]);

  return (
    <aside className="sidebar">
      {items.map((item) => (
        <div 
          key={item.id}
          className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={() => setActiveItem(item.id)}
          data-id={item.id}
          data-active={activeItem === item.id ? 'true' : 'false'}
          aria-selected={activeItem === item.id}
        >
          {item.icon && <span className="sidebar-icon">{item.icon}</span>}
          <span>{item.name}</span>
        </div>
      ))}
    </aside>
  );
}
