import { supabase, supabaseAnonKey, supabaseUrl } from './supabase';

export async function inviteUser(payload: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ error: string | null }> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    return { error: 'You must be signed in to invite users.' };
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/invite-user`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { error: null };
    }

    let message = `Invite failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: unknown; message?: unknown };
      if (typeof data.error === 'string' && data.error.trim()) {
        message = data.error;
      } else if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message;
      }
    } catch {
      // ignore parse errors and keep status-based message
    }
    return { error: message };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { error: message };
  }
}
