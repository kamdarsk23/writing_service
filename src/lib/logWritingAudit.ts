import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type WritingAuditAction = 'created' | 'edited' | 'deleted';

async function logInvokeFailure(
  error: unknown,
  response: Response | undefined,
): Promise<void> {
  let extra = '';
  const res = response ?? (error instanceof FunctionsHttpError ? error.context : undefined);
  if (res && typeof res.clone === 'function') {
    try {
      const text = await res.clone().text();
      if (text) extra = ` | ${text.slice(0, 800)}`;
    } catch {
      /* ignore */
    }
  }
  const msg =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.warn('[writing-audit]', msg + extra);
}

/**
 * Appends a row to the audit CSV via Supabase Edge Function `append-writing-log`.
 *
 * Uses `getSession()` immediately before invoke and sets `Authorization` to the **user**
 * access token only. Supabase's default fetch fallback uses the anon key as Bearer when no
 * session is visible to the client, which the Edge gateway rejects with 401 Invalid JWT.
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

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    if (import.meta.env.DEV) {
      console.warn(
        '[writing-audit] skipped: no user JWT from getSession()',
        sessionError?.message ?? '',
      );
    }
    return;
  }

  try {
    const { error, response } = await supabase.functions.invoke('append-writing-log', {
      body: payload,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      await logInvokeFailure(error, response);
    } else if (import.meta.env.DEV) {
      console.info('[writing-audit] ok', payload);
    }
  } catch (e) {
    console.warn('[writing-audit]', e instanceof Error ? e.message : e);
  }
}
