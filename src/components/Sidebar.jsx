"use client";

export default function Sidebar({ items, activeItem, setActiveItem }) {
  return (
    <aside className="sidebar">
      {items.map((item) => (
        <div 
          key={item.id}
          className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={() => setActiveItem(item.id)}
        >
          {item.icon && <span className="sidebar-icon">{item.icon}</span>}
          <span>{item.name}</span>
        </div>
      ))}
    </aside>
  );
}
