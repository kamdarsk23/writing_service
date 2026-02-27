import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { QTreeRoot, QTreeNode, QTreeNodeTree } from '../types';
import { useAuth } from './useAuth';

export function useQTrees() {
  const { user } = useAuth();
  const [qtrees, setQtrees] = useState<QTreeRoot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQTrees = useCallback(
    async (folderId?: string | null) => {
      if (!user) return;
      setLoading(true);

      let query = supabase
        .from('qtree_roots')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else if (folderId === null) {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query;
      if (!error && data) {
        setQtrees(data);
      }
      setLoading(false);
    },
    [user],
  );

  const fetchQTreeRoot = useCallback(async (rootId: string): Promise<QTreeRoot | null> => {
    const { data, error } = await supabase
      .from('qtree_roots')
      .select('*')
      .eq('id', rootId)
      .single();

    if (error) return null;
    return data;
  }, []);

  const fetchQTreeNodes = useCallback(async (rootId: string): Promise<QTreeNode[]> => {
    const { data, error } = await supabase
      .from('qtree_nodes')
      .select('*')
      .eq('qtree_root_id', rootId);

    if (error) return [];
    return data ?? [];
  }, []);

  const fetchQTreeNode = useCallback(async (nodeId: string): Promise<QTreeNode | null> => {
    const { data, error } = await supabase
      .from('qtree_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (error) return null;
    return data;
  }, []);

  const createQTreeRoot = async (
    question: string,
    folderId?: string | null,
  ): Promise<QTreeRoot | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('qtree_roots')
      .insert({
        user_id: user.id,
        folder_id: folderId ?? null,
        question,
        answer: {},
      })
      .select()
      .single();

    if (error) return null;
    return data;
  };

  const createQTreeNode = async (
    rootId: string,
    parentRootId: string | null,
    parentNodeId: string | null,
    question: string,
  ): Promise<QTreeNode | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('qtree_nodes')
      .insert({
        user_id: user.id,
        qtree_root_id: rootId,
        parent_root_id: parentRootId,
        parent_node_id: parentNodeId,
        question,
        answer: {},
      })
      .select()
      .single();

    if (error) return null;
    return data;
  };

  const updateQTreeRoot = async (
    id: string,
    updates: { question?: string; answer?: Record<string, unknown> },
  ) => {
    const { error } = await supabase.from('qtree_roots').update(updates).eq('id', id);
    return { error };
  };

  const updateQTreeNode = async (
    id: string,
    updates: { question?: string; answer?: Record<string, unknown> },
  ) => {
    const { error } = await supabase.from('qtree_nodes').update(updates).eq('id', id);
    return { error };
  };

  const deleteQTreeRoot = async (id: string) => {
    const { error } = await supabase.from('qtree_roots').delete().eq('id', id);
    if (!error) {
      setQtrees((prev) => prev.filter((q) => q.id !== id));
    }
    return { error };
  };

  const renameQTreeRoot = async (id: string, question: string) => {
    const { error } = await supabase.from('qtree_roots').update({ question }).eq('id', id);
    if (!error) {
      setQtrees((prev) => prev.map((q) => (q.id === id ? { ...q, question } : q)));
    }
    return { error };
  };

  const moveQTree = async (qtreeId: string, newFolderId: string | null) => {
    const { error } = await supabase
      .from('qtree_roots')
      .update({ folder_id: newFolderId })
      .eq('id', qtreeId);
    if (!error) {
      setQtrees((prev) => prev.filter((q) => q.id !== qtreeId));
    }
    return { error };
  };

  function buildNodeTree(nodes: QTreeNode[], rootId: string): QTreeNodeTree[] {
    const nodeMap = new Map<string, QTreeNodeTree>();
    for (const node of nodes) {
      nodeMap.set(node.id, { ...node, children: [] });
    }

    const roots: QTreeNodeTree[] = [];
    for (const node of nodeMap.values()) {
      if (node.parent_root_id === rootId) {
        roots.push(node);
      } else if (node.parent_node_id) {
        const parent = nodeMap.get(node.parent_node_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    }
    return roots;
  }

  return {
    qtrees,
    loading,
    fetchQTrees,
    fetchQTreeRoot,
    fetchQTreeNodes,
    fetchQTreeNode,
    createQTreeRoot,
    createQTreeNode,
    updateQTreeRoot,
    updateQTreeNode,
    deleteQTreeRoot,
    renameQTreeRoot,
    moveQTree,
    buildNodeTree,
  };
}
