/** Full URL for Supabase password-recovery redirect (hash router). Add this exact URL to Supabase → Authentication → URL configuration → Redirect URLs. */
export function getPasswordRecoveryRedirectTo(): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  return new URL('#/auth/update-password', withSlash).href;
}
