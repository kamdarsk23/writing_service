import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQTrees } from '../hooks/useQTrees';
import type { QTreeRoot, QTreeNodeTree } from '../types';

// Extract plain text from a TipTap JSON doc, truncated
function extractPlainText(answer: Record<string, unknown>, maxLen = 80): string {
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (n.type === 'text' && typeof n.text === 'string') {
      parts.push(n.text);
    }
    if (Array.isArray(n.content)) {
      for (const child of n.content) walk(child);
    }
  }

  walk(answer);
  const text = parts.join('').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

interface QTreeNodeCardProps {
  // Either root data or a node
  question: string;
  answer: Record<string, unknown>;
  editorPath: string; // navigate here on card click
  nodeChildren: QTreeNodeTree[];
  depth: number;
  rootId: string;
  parentRootId: string | null;
  parentNodeId: string | null;
  onAddChild: (parentRootId: string | null, parentNodeId: string | null) => void;
}

function QTreeNodeCard({
  question,
  answer,
  editorPath,
  nodeChildren,
  depth,
  parentRootId,
  parentNodeId,
  onAddChild,
}: QTreeNodeCardProps) {
  const navigate = useNavigate();
  const preview = extractPlainText(answer);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild(parentRootId, parentNodeId);
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : 0 }}>
      <div style={depth > 0 ? { borderLeft: '2px solid #d1c8d0', paddingLeft: '1rem' } : {}}>
        {/* Card + add button */}
        <div className="mb-1 flex items-stretch gap-2">
          <div
            onClick={() => navigate(editorPath)}
            className="flex-1 border rounded-lg p-3 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
            style={{ backgroundColor: '#9e8f98' }}
          >
            <p className="font-medium text-sm text-white truncate">
              {question || 'Untitled'}
            </p>
            {preview ? (
              <p className="text-xs text-gray-200 mt-1 truncate">{preview}</p>
            ) : (
              <p className="text-xs text-gray-300 mt-1 italic">No answer yet</p>
            )}
          </div>
          <button
            onClick={handleAdd}
            title="Add child node"
            className="self-center flex-shrink-0 w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-base leading-none cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Recursive children */}
        {nodeChildren.length > 0 && (
          <div className="mt-1 mb-2">
            {nodeChildren.map((child) => (
              <QTreeNodeCard
                key={child.id}
                question={child.question}
                answer={child.answer}
                editorPath={`/qtree/${child.qtree_root_id}/node/${child.id}`}
                nodeChildren={child.children}
                depth={depth + 1}
                rootId={child.qtree_root_id}
                parentRootId={null}
                parentNodeId={child.id}
                onAddChild={onAddChild}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function QTreePage() {
  const { rootId } = useParams<{ rootId: string }>();
  const navigate = useNavigate();
  const { fetchQTreeRoot, fetchQTreeNodes, createQTreeNode, buildNodeTree } = useQTrees();

  const [root, setRoot] = useState<QTreeRoot | null>(null);
  const [nodeTree, setNodeTree] = useState<QTreeNodeTree[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!rootId) return;
    setLoading(true);
    const [fetchedRoot, fetchedNodes] = await Promise.all([
      fetchQTreeRoot(rootId),
      fetchQTreeNodes(rootId),
    ]);
    if (!fetchedRoot) {
      navigate('/');
      return;
    }
    setRoot(fetchedRoot);
    setNodeTree(buildNodeTree(fetchedNodes, rootId));
    setLoading(false);
  }, [rootId, fetchQTreeRoot, fetchQTreeNodes, buildNodeTree, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch when the user navigates back to this page
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [load]);

  const handleAddChild = async (
    parentRootId: string | null,
    parentNodeId: string | null,
  ) => {
    if (!rootId) return;
    const newNode = await createQTreeNode(rootId, parentRootId, parentNodeId, '');
    if (newNode) {
      navigate(`/qtree/${rootId}/node/${newNode.id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!root) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
      >
        ← Back
      </button>

      {/* Root node + entire subtree rendered from a single recursive call */}
      <QTreeNodeCard
        question={root.question}
        answer={root.answer}
        editorPath={`/qtree/${root.id}/node/root`}
        nodeChildren={nodeTree}
        depth={0}
        rootId={root.id}
        parentRootId={root.id}
        parentNodeId={null}
        onAddChild={handleAddChild}
      />
    </div>
  );
}
