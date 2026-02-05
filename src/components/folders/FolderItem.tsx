import { useState } from 'react';
import type { FolderNode } from '../../types';
import { RenameFolderDialog } from './RenameFolderDialog';

interface FolderItemProps {
  node: FolderNode;
  selectedFolderId: string | null;
  depth: number;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

export function FolderItem({
  node,
  selectedFolderId,
  depth,
  onSelect,
  onRename,
  onDelete,
}: FolderItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedFolderId;

  return (
    <div>
      <div
        className={`flex items-center text-sm rounded px-1 py-0.5 cursor-pointer group ${
          isSelected ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-200'
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-4 text-xs text-gray-400 shrink-0"
        >
          {hasChildren ? (expanded ? '▼' : '▶') : ''}
        </button>
        <button
          onClick={() => onSelect(node.id)}
          className="flex-1 text-left truncate ml-1"
        >
          {node.name}
        </button>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 px-1"
          >
            ...
          </button>
          {showMenu && (
            <div className="absolute right-0 top-5 bg-white border rounded shadow-sm z-10 text-xs">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowRename(true);
                }}
                className="block w-full text-left px-3 py-1.5 hover:bg-gray-100"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(node.id);
                }}
                className="block w-full text-left px-3 py-1.5 hover:bg-gray-100 text-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded &&
        node.children.map((child) => (
          <FolderItem
            key={child.id}
            node={child}
            selectedFolderId={selectedFolderId}
            depth={depth + 1}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}

      {showRename && (
        <RenameFolderDialog
          currentName={node.name}
          onConfirm={async (name) => {
            await onRename(node.id, name);
            setShowRename(false);
          }}
          onCancel={() => setShowRename(false)}
        />
      )}
    </div>
  );
}
