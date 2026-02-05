import { useState } from 'react';
import type { FolderNode } from '../../types';

interface MoveToModalProps {
  title: string;
  tree: FolderNode[];
  excludeId?: string | null;
  onConfirm: (destinationId: string | null) => void;
  onCancel: () => void;
}

function PickerNode({
  node,
  excludeId,
  selectedId,
  onSelect,
  depth,
}: {
  node: FolderNode;
  excludeId?: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  depth: number;
}) {
  if (node.id === excludeId) return null;

  const isSelected = selectedId === node.id;

  return (
    <>
      <button
        onClick={() => onSelect(node.id)}
        className={`w-full text-left px-2 py-1 text-sm rounded ${
          isSelected ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        📁 {node.name}
      </button>
      {node.children.map((child) => (
        <PickerNode
          key={child.id}
          node={child}
          excludeId={excludeId}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

export function MoveToModal({ title, tree, excludeId, onConfirm, onCancel }: MoveToModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow p-4 w-80 max-h-[60vh] flex flex-col">
        <h3 className="font-semibold mb-3">{title}</h3>
        <div className="flex-1 overflow-y-auto border rounded p-1 mb-3">
          <button
            onClick={() => setSelectedId(null)}
            className={`w-full text-left px-2 py-1 text-sm rounded ${
              selectedId === null ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
            }`}
          >
            Root (All Works)
          </button>
          {tree.map((node) => (
            <PickerNode
              key={node.id}
              node={node}
              excludeId={excludeId}
              selectedId={selectedId}
              onSelect={setSelectedId}
              depth={1}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1 text-sm">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedId)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}
