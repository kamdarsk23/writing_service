import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Work } from '../types';
import { useAuth } from './useAuth';

export function useWorks() {
  const { user } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorks = useCallback(
    async (folderId?: string | null) => {
      if (!user) return;
      setLoading(true);

      let query = supabase
        .from('works')
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
        setWorks(data);
      }
      setLoading(false);
    },
    [user],
  );

  const fetchWork = async (id: string): Promise<Work | null> => {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  };

  const createWork = async (folderId?: string | null): Promise<Work | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('works')
      .insert({
        user_id: user.id,
        folder_id: folderId ?? null,
        title: 'Untitled',
        content: {},
      })
      .select()
      .single();

    if (error) return null;
    return data;
  };

  const updateWork = async (
    id: string,
    updates: { title?: string; content?: Record<string, unknown> },
  ) => {
    const { error } = await supabase.from('works').update(updates).eq('id', id);
    return { error };
  };

  const deleteWork = async (id: string) => {
    const { error } = await supabase.from('works').delete().eq('id', id);
    if (!error) {
      setWorks((prev) => prev.filter((w) => w.id !== id));
    }
    return { error };
  };

  return { works, loading, fetchWorks, fetchWork, createWork, updateWork, deleteWork };
}
