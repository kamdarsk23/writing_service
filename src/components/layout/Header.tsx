import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFolders } from '../../hooks/useFolders';
import { useWorks } from '../../hooks/useWorks';
import { NewButtonDropdown } from './NewButtonDropdown';
import { CreateFolderDialog } from '../folders/CreateFolderDialog';

export function Header() {
  const { user, signOut } = useAuth();
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { createFolder } = useFolders();
  const { createWork } = useWorks();
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const handleNewWork = async () => {
    const work = await createWork(folderId ?? null);
    if (work) {
      navigate(`/work/${work.id}`);
    }
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder(name, folderId ?? null);
    setShowCreateFolder(false);
    window.dispatchEvent(new CustomEvent('refetch-dashboard'));
  };

  return (
    <>
      <header className="h-12 border-b flex items-center justify-between px-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Writing Service</span>
          <NewButtonDropdown
            onNewWork={handleNewWork}
            onNewFolder={() => setShowCreateFolder(true)}
          />
        </div>
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
      {showCreateFolder && (
        <CreateFolderDialog
          onConfirm={handleCreateFolder}
          onCancel={() => setShowCreateFolder(false)}
        />
      )}
    </>
  );
}
