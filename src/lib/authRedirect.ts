/**
 * URL Supabase redirects to after the user clicks the password-reset link.
 *
 * Use the **app base only** (no #/auth/...). Supabase appends #access_token=...&type=recovery
 * to the redirect; long URLs break if pasted into Site URL (fields truncate — e.g.
 * update-passwo). Our bootstrap then sends users to #/auth/update-password.
 *
 * The path MUST end with `/` before `#` so Vite (base: `/writing_service/`) serves the SPA.
 * Wrong: .../writing_service#access_token   → Vite “did you mean .../writing_service/” page.
 * Right:  .../writing_service/#access_token  → app loads, auth hash is read.
 *
 * In Supabase → Authentication → URL configuration, set Site URL and Redirect URLs to the
 * same base **including** the trailing slash, e.g. http://localhost:5173/writing_service/
 */
export function getPasswordRecoveryRedirectTo(): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  return base.endsWith('/') ? base : `${base}/`;
}
