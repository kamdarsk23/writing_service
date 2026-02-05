import type { FolderNode } from '../../types';
import { FolderItem } from './FolderItem';

interface FolderTreeProps {
  nodes: FolderNode[];
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

export function FolderTree({ nodes, selectedFolderId, onSelect, onRename, onDelete }: FolderTreeProps) {
  if (nodes.length === 0) {
    return <p className="text-xs text-gray-400">No folders yet</p>;
  }

  return (
    <div>
      {nodes.map((node) => (
        <FolderItem
          key={node.id}
          node={node}
          selectedFolderId={selectedFolderId}
          depth={0}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
