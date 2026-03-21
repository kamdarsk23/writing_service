import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import './index.css';
import App from './App.tsx';

/**
 * Supabase recovery links use a hash like #access_token=...&type=recovery — not a
 * React Router path. We must:
 * 1. Let auth finish (getSession waits for init that reads the URL).
 * 2. Wait for PASSWORD_RECOVERY (fired on a timeout after URL session is saved).
 * 3. If session exists → set hash to #/auth/update-password.
 * 4. If tokens in URL but no session → #/auth (invalid/expired); never send users to
 *    update-password without a session (that caused "invalid link" on first open).
 */
async function prepareAuthUrlForHashRouter(): Promise<void> {
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

  // GoTrue notifies PASSWORD_RECOVERY in setTimeout(0) after saving the URL session.
  await new Promise((r) => setTimeout(r, 0));
  subscription.unsubscribe();

  const { pathname, search } = window.location;
  const h = window.location.hash;

  if (passwordRecovery && session) {
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
      !session
    ) {
      window.history.replaceState(null, '', `${pathname}${search}#/auth`);
    }
  }
}

void prepareAuthUrlForHashRouter().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
