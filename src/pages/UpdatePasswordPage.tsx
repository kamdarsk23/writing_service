import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * After a recovery redirect, React context can briefly lag behind storage.
 * Poll getSession a few times before showing "invalid or expired".
 */
export function UpdatePasswordPage() {
  const { session: ctxSession, loading: authLoading } = useAuth();
  const [polledSession, setPolledSession] = useState<Session | null | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    void (async () => {
      for (const delayMs of [0, 80, 200, 450]) {
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
        if (cancelled) return;
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          if (!cancelled) setPolledSession(data.session);
          return;
        }
      }
      if (!cancelled) setPolledSession(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading]);

  const loading = authLoading || (ctxSession == null && polledSession === undefined);
  const session = ctxSession ?? polledSession ?? null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm p-6 bg-white rounded shadow text-center">
          <p className="text-gray-700 mb-4">
            This reset link is invalid or expired. Request a new one from the sign-in page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            In Supabase → Authentication → URL configuration, set Site URL and Redirect URLs
            to your app base with a trailing slash (e.g. …/writing_service/) — required for
            Vite. No hash in the URL. Save, then request a new reset email.
          </p>
          <Link to="/auth" className="text-blue-600 underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm p-6 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-2 text-center">Set a new password</h1>
        <p className="text-sm text-gray-600 mb-4 text-center">Choose a password you can remember.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="border rounded px-3 py-2"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
