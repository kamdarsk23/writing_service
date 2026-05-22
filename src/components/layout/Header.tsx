import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { inviteUser } from '../../lib/inviteUser';
import { deleteUserByEmail } from '../../lib/deleteUser';

export function Header() {
  const { user, signOut } = useAuth();
  const ownerEmail = (import.meta.env.VITE_OWNER_EMAIL as string | undefined)?.trim().toLowerCase() ?? '';
  const isOwner = !!user?.email && !!ownerEmail && user.email.toLowerCase() === ownerEmail;

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error: inviteError } = await inviteUser({
      email,
      password,
      displayName: displayName || undefined,
    });
    setLoading(false);
    if (inviteError) {
      setError(inviteError);
      return;
    }
    setSuccess(`Created account for ${email}. Share this email + password with the user.`);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error: deleteError } = await deleteUserByEmail({ email: deleteEmail });
    setLoading(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    setSuccess(`Deleted ${deleteEmail}. Their account and related data were removed.`);
    setDeleteEmail('');
  };

  return (
    <>
      <header className="h-12 border-b flex items-center justify-between px-4 bg-white shrink-0">
      <span className="font-semibold">{user?.email}'s Writing Workspace</span>
      <div className="flex items-center gap-3 text-sm">
        {isOwner && (
          <button
            onClick={() => {
              setShowInvite(true);
              setError('');
              setSuccess('');
            }}
            className="text-blue-600 hover:underline"
          >
            Invite User
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => {
              setShowDelete(true);
              setError('');
              setSuccess('');
            }}
            className="text-blue-600 hover:underline"
          >
            Delete User
          </button>
        )}
        <button
          onClick={signOut}
          className="text-red-600 hover:underline"
        >
          Sign Out
        </button>
      </div>
      </header>
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Invite user</h2>
            <p className="text-sm text-gray-600 mb-3">
              Creates a new account immediately. Share the email and password you set.
            </p>
            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="User email (used to log in)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Display name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border rounded px-3 py-2"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-700">{success}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-3 py-2 rounded border"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Delete user</h2>
            <p className="text-sm text-gray-600 mb-3">
              Deletes the user account by email. Their works/folders/qtrees will also be deleted.
            </p>
            <form onSubmit={handleDelete} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="User email to delete"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                required
                className="border rounded px-3 py-2"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-700">{success}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="px-3 py-2 rounded border"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
