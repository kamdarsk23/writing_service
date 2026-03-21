import { supabase, supabaseAnonKey, supabaseUrl } from './supabase';

export type WritingAuditAction = 'created' | 'edited' | 'deleted';

const AUDIT_FETCH_MS = 25_000;
/** If access token expires within this many seconds, refresh before calling the Edge Function. */
const AUDIT_REFRESH_MARGIN_SEC = 120;

function accessTokenExpiresAtSec(token: string): number | null {
  try {
    const seg = token.split('.')[1];
    if (!seg) return null;
    const json = JSON.parse(
      atob(seg.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: unknown };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

/** User JWT for the function: refresh if near expiry so the gateway accepts Bearer (when verify_jwt is on). */
async function getAccessTokenForAudit(): Promise<string | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return null;
  }

  let token = session.access_token;
  const exp = accessTokenExpiresAtSec(token);
  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = exp != null && exp < now + AUDIT_REFRESH_MARGIN_SEC;

  if (needsRefresh) {
    const { data, error: refErr } = await supabase.auth.refreshSession();
    if (refErr || !data.session?.access_token) {
      if (import.meta.env.DEV) {
        console.warn('[writing-audit] refresh failed; audit may 401', refErr?.message ?? '');
      }
      return null;
    }
    token = data.session.access_token;
  }

  return token;
}

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
 * Refreshes the session when the access token is inside AUDIT_REFRESH_MARGIN_SEC of expiry,
 * then plain `fetch` (no invoke) so we do not double-trigger getAccessToken on the same request.
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

  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    console.warn('[writing-audit] skipped: missing VITE_SUPABASE_PROJECT_URL or VITE_SUPABASE_ANON_KEY');
    return;
  }

  const accessToken = await getAccessTokenForAudit();
  if (!accessToken) {
    console.warn('[writing-audit] skipped: no valid user access token');
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
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
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
