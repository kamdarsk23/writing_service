import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

function formatAuthError(err: Error | null): string {
  if (!err) return '';
  const m = err.message.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many') || m.includes('429')) {
    return 'Too many emails were sent from this project recently. Wait an hour or raise the limit in Supabase (Authentication → Rate Limits / your project Auth settings), then try again.';
  }
  return err.message;
}

export function LoginForm() {
  const { signIn, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      if (err) setError(formatAuthError(err));
    } else {
      const { error: err } = await requestPasswordReset(email);
      if (err) setError(formatAuthError(err));
      else
        setInfo('If this email is registered, you will receive a reset link shortly.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        {mode === 'signin' && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {info && <p className="text-green-700 text-sm">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {loading
            ? mode === 'signin'
              ? 'Signing in...'
              : 'Sending...'
            : mode === 'signin'
              ? 'Sign In'
              : 'Send reset link'}
        </button>
      </form>
      <button
        type="button"
        className="text-sm text-blue-600 underline text-left"
        onClick={() => {
          setMode(mode === 'signin' ? 'reset' : 'signin');
          setError('');
          setInfo('');
        }}
      >
        {mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}
      </button>
    </div>
  );
}
