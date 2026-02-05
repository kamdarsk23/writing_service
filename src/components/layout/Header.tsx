import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="h-12 border-b flex items-center justify-between px-4 bg-white shrink-0">
      <span className="font-semibold">Writing Service</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">{user?.email}</span>
        <button
          onClick={signOut}
          className="text-red-600 hover:underline"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
