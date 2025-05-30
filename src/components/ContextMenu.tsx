import React from 'react';

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void; // Callback to close the menu
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Basic check, can be improved to check if click is within the menu itself
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.15)',
        padding: '5px 0',
        zIndex: 1000,
        minWidth: '150px',
      }}
      // Prevent click inside menu from closing it immediately via the document listener
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose(); // Close menu after action
            }
          }}
          style={{
            padding: '8px 12px',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            color: item.disabled ? '#aaa' : '#333',
            backgroundColor: item.disabled ? '#f5f5f5' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            if (!item.disabled) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
