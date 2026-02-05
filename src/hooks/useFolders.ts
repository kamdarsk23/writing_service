import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Folder, FolderNode } from '../types';
import { useAuth } from './useAuth';

function buildFolderTree(folders: Folder[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  for (const f of folders) {
    map.set(f.id, { ...f, children: [] });
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function useFolders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (!error && data) {
      setFolders(data);
      setTree(buildFolderTree(data));
    }
    setLoading(false);
  }, [user]);

  const createFolder = async (name: string, parentId?: string | null) => {
    if (!user) return;
    const { error } = await supabase.from('folders').insert({
      user_id: user.id,
      name,
      parent_id: parentId ?? null,
    });
    if (!error) await fetchFolders();
    return { error };
  };

  const renameFolder = async (id: string, name: string) => {
    const { error } = await supabase.from('folders').update({ name }).eq('id', id);
    if (!error) await fetchFolders();
    return { error };
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (!error) await fetchFolders();
    return { error };
  };

  return { folders, tree, loading, fetchFolders, createFolder, renameFolder, deleteFolder };
}
