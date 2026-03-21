import { supabase } from './supabase';

export type WritingAuditAction = 'created' | 'edited' | 'deleted';

const AUDIT_FETCH_MS = 25_000;

function isAllowedSupabaseProjectUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.username || u.password) return false;
    if (u.protocol === 'https:') return true;
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Appends a row to the audit CSV via Supabase Edge Function `append-writing-log`.
 *
 * We call the function with plain `fetch`, not `supabase.functions.invoke()`. The shared
 * Supabase client uses `fetchWithAuth`, which always runs `getAccessToken()` → `getSession()`
 * before each request; when the access token is in the expiry margin that triggers a refresh,
 * a stale refresh token surfaces as `Invalid Refresh Token` in the console even though we
 * passed a user JWT — the DB write already succeeded.
 *
 * One `getSession()` here, then send that access_token; no extra refresh on this request.
 *
 * For `deleted`, call this while the row still exists (before DELETE), so the function can read `title`.
 */
export async function logWritingAudit(payload: {
  action: WritingAuditAction;
  workId: string;
}): Promise<void> {
  const flag = import.meta.env.VITE_WRITING_AUDIT_ENABLED;
  if (flag !== 'true') {
    if (import.meta.env.DEV && flag !== undefined && flag !== '') {
      console.info(
        '[writing-audit] skipped: VITE_WRITING_AUDIT_ENABLED must be exactly "true" (no quotes in .env). Got:',
        JSON.stringify(flag),
      );
    }
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl?.trim() || !anonKey?.trim()) {
    console.warn('[writing-audit] skipped: missing VITE_SUPABASE_PROJECT_URL or VITE_SUPABASE_ANON_KEY');
    return;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    console.warn(
      '[writing-audit] skipped: no user JWT from getSession()',
      sessionError?.message ?? '',
    );
    return;
  }

  const base = supabaseUrl.trim().replace(/\/+$/, '');
  if (!isAllowedSupabaseProjectUrl(base)) {
    console.warn('[writing-audit] skipped: invalid VITE_SUPABASE_PROJECT_URL');
    return;
  }
  const url = `${base}/functions/v1/append-writing-log`;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUDIT_FETCH_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[writing-audit]', res.status, text.slice(0, 800));
    } else if (import.meta.env.DEV) {
      console.info('[writing-audit] ok', payload);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && e.name === 'AbortError') {
      console.warn('[writing-audit] timed out after', AUDIT_FETCH_MS, 'ms');
    } else {
      console.warn('[writing-audit]', msg);
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
}
