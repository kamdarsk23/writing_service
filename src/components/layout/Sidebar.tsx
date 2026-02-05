import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFolders } from '../../hooks/useFolders';
import { useWorks } from '../../hooks/useWorks';
import { FolderTree } from '../folders/FolderTree';
import { CreateFolderDialog } from '../folders/CreateFolderDialog';

export function Sidebar() {
  const { tree, loading, fetchFolders, createFolder, renameFolder, deleteFolder } = useFolders();
  const { createWork } = useWorks();
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleNewWork = async () => {
    const work = await createWork(folderId ?? null);
    if (work) {
      navigate(`/work/${work.id}`);
    }
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder(name, folderId ?? null);
    setShowCreateFolder(false);
  };

  return (
    <aside className="w-60 border-r bg-gray-50 flex flex-col h-full overflow-hidden">
      <div className="p-3 flex flex-col gap-2 border-b">
        <button
          onClick={handleNewWork}
          className="w-full bg-blue-600 text-white rounded px-3 py-1.5 text-sm"
        >
          + New Work
        </button>
        <button
          onClick={() => setShowCreateFolder(true)}
          className="w-full border rounded px-3 py-1.5 text-sm"
        >
          + New Folder
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate('/')}
          className={`w-full text-left text-sm px-2 py-1 rounded mb-2 ${
            !folderId ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-200'
          }`}
        >
          All Works
        </button>
        {loading ? (
          <p className="text-xs text-gray-400">Loading...</p>
        ) : (
          <FolderTree
            nodes={tree}
            selectedFolderId={folderId ?? null}
            onSelect={(id) => navigate(`/folder/${id}`)}
            onRename={renameFolder}
            onDelete={deleteFolder}
          />
        )}
      </div>

      {showCreateFolder && (
        <CreateFolderDialog
          onConfirm={handleCreateFolder}
          onCancel={() => setShowCreateFolder(false)}
        />
      )}
    </aside>
  );
}
