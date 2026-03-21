import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import './index.css';
import App from './App.tsx';

/** Captured on first tick; Supabase may clear the hash while parsing the URL. */
function hashLooksLikePasswordRecovery(hash: string): boolean {
  if (!hash || hash.startsWith('#/')) return false;
  try {
    const decoded = decodeURIComponent(hash);
    return decoded.includes('type=recovery');
  } catch {
    return hash.includes('type=recovery') || hash.includes('type%3Drecovery');
  }
}

/**
 * Supabase recovery links use a hash like #access_token=...&type=recovery — not a
 * React Router path. We must:
 * 1. Let auth finish (getSession waits for init that reads the URL).
 * 2. Prefer PASSWORD_RECOVERY when it fires; it often arrives *after* getSession(),
 *    so also detect type=recovery in the hash we captured up front.
 * 3. If session exists → set hash to #/auth/update-password.
 * 4. If tokens in URL but no session → #/auth (invalid/expired); never send users to
 *    update-password without a session (that caused "invalid link" on first open).
 */
async function prepareAuthUrlForHashRouter(): Promise<void> {
  try {
    const { pathname, search } = window.location;
    let h = window.location.hash;
    const recoveryFromUrl = hashLooksLikePasswordRecovery(h);
    // Truncated Site URL in Supabase often becomes .../update-passwo
    if (h === '#/auth/update-passwo' || h.startsWith('#/auth/update-passwo?')) {
      window.history.replaceState(null, '', `${pathname}${search}#/auth/update-password`);
      h = '#/auth/update-password';
    }

    let passwordRecovery = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        passwordRecovery = true;
      }
    });

    await supabase.auth.getSession();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // GoTrue may emit PASSWORD_RECOVERY on the next tick or slightly later; don't unlisten too soon.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 100));
    subscription.unsubscribe();

    let sessionOut = session;
    // Session can lag URL parsing on cold start; don't send recovery users to /auth too early.
    if ((passwordRecovery || recoveryFromUrl) && !sessionOut) {
      await new Promise((r) => setTimeout(r, 250));
      const { data: later } = await supabase.auth.getSession();
      sessionOut = later.session ?? null;
    }

    if (sessionOut && (passwordRecovery || recoveryFromUrl)) {
      window.history.replaceState(null, '', `${pathname}${search}#/auth/update-password`);
      return;
    }

    if (h && !h.startsWith('#/')) {
      if (h.includes('error_code') || h.includes('error_description')) {
        window.history.replaceState(null, '', `${pathname}${search}#/auth`);
        return;
      }
      if (
        (h.includes('access_token') || h.includes('type=recovery')) &&
        !sessionOut
      ) {
        window.history.replaceState(null, '', `${pathname}${search}#/auth`);
      }
    }
  } catch (e) {
    console.warn('[auth bootstrap]', e instanceof Error ? e.message : e);
  }
}

void prepareAuthUrlForHashRouter().then(() => {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    console.error('[auth bootstrap] #root missing');
    return;
  }
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
