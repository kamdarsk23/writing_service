import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFolders } from '../hooks/useFolders';
import { useWorks } from '../hooks/useWorks';
import { useContextMenu } from '../hooks/useContextMenu';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { FolderCard } from '../components/dashboard/FolderCard';
import { ContextMenu } from '../components/dashboard/ContextMenu';
import { MoveToModal } from '../components/dashboard/MoveToModal';
import { WorksList } from '../components/works/WorksList';
import { RenameFolderDialog } from '../components/folders/RenameFolderDialog';
import { RenameWorkDialog } from '../components/works/RenameWorkDialog';
import { CreateFolderDialog } from '../components/folders/CreateFolderDialog';
import { CreateWorkDialog } from '../components/works/CreateWorkDialog';
import { NewButtonDropdown } from '../components/layout/NewButtonDropdown';
import type { Work } from '../types';

type SortKey = 'updated_at' | 'created_at' | 'title';

function sortWorks(works: Work[], key: SortKey): Work[] {
  return [...works].sort((a, b) => {
    if (key === 'title') {
      return a.title.localeCompare(b.title);
    }
    return new Date(b[key]).getTime() - new Date(a[key]).getTime();
  });
}

export function DashboardPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const {
    folders,
    tree,
    loading: foldersLoading,
    fetchFolders,
    getChildFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
  } = useFolders();
  const { works, loading: worksLoading, fetchWorks, createWork, deleteWork, moveWork, renameWork } = useWorks();
  const { menu, show: showMenu, hide: hideMenu } = useContextMenu();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [columns, setColumns] = useState(6);

  const [moveModalTarget, setMoveModalTarget] = useState<{
    id: string;
    type: 'folder' | 'work';
    name: string;
  } | null>(null);
  const [renameFolderTarget, setRenameFolderTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameWorkTarget, setRenameWorkTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateWork, setShowCreateWork] = useState(false);

  const refetch = useCallback(() => {
    fetchFolders();
    fetchWorks(folderId ?? null);
  }, [fetchFolders, fetchWorks, folderId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    setSearchQuery('');
  }, [folderId]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('refetch-dashboard', handler);
    return () => window.removeEventListener('refetch-dashboard', handler);
  }, [refetch]);

  const childFolders = getChildFolders(folderId ?? null);

  const query = searchQuery.toLowerCase().trim();

  const filteredFolders = useMemo(
    () => (query ? childFolders.filter((f) => f.name.toLowerCase().includes(query)) : childFolders),
    [childFolders, query],
  );

  const filteredAndSortedWorks = useMemo(
    () => {
      const filtered = query ? works.filter((w) => w.title.toLowerCase().includes(query)) : works;
      return sortWorks(filtered, sortKey);
    },
    [works, query, sortKey],
  );

  const handleFolderContextMenu = (e: React.MouseEvent, id: string) => {
    showMenu(e, id, 'folder');
  };

  const handleWorkContextMenu = (e: React.MouseEvent, workId: string) => {
    showMenu(e, workId, 'work');
  };

  const handleDelete = async () => {
    if (!menu.targetId || !menu.targetType) return;
    if (menu.targetType === 'folder') {
      await deleteFolder(menu.targetId);
    } else {
      await deleteWork(menu.targetId);
    }
    refetch();
  };

  const handleMoveTo = () => {
    if (!menu.targetId || !menu.targetType) return;
    const name =
      menu.targetType === 'folder'
        ? folders.find((f) => f.id === menu.targetId)?.name ?? 'item'
        : works.find((w) => w.id === menu.targetId)?.title ?? 'item';
    setMoveModalTarget({ id: menu.targetId, type: menu.targetType, name });
  };

  const handleMoveConfirm = async (destinationId: string | null) => {
    if (!moveModalTarget) return;
    if (moveModalTarget.type === 'folder') {
      await moveFolder(moveModalTarget.id, destinationId);
    } else {
      await moveWork(moveModalTarget.id, destinationId);
    }
    setMoveModalTarget(null);
    refetch();
  };

  const handleRename = () => {
    if (!menu.targetId || !menu.targetType) return;
    if (menu.targetType === 'folder') {
      const folder = folders.find((f) => f.id === menu.targetId);
      if (folder) setRenameFolderTarget({ id: folder.id, name: folder.name });
    } else {
      const work = works.find((w) => w.id === menu.targetId);
      if (work) setRenameWorkTarget({ id: work.id, title: work.title });
    }
  };

  const handleRenameFolderConfirm = async (newName: string) => {
    if (!renameFolderTarget) return;
    await renameFolder(renameFolderTarget.id, newName);
    setRenameFolderTarget(null);
    refetch();
  };

  const handleRenameWorkConfirm = async (newTitle: string) => {
    if (!renameWorkTarget) return;
    await renameWork(renameWorkTarget.id, newTitle);
    setRenameWorkTarget(null);
  };

  const handleCreateWork = async (title: string) => {
    const work = await createWork(title, folderId ?? null);
    setShowCreateWork(false);
    if (work) {
      navigate(`/work/${work.id}`);
    }
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder(name, folderId ?? null);
    setShowCreateFolder(false);
    refetch();
  };

  const contextMenuItems = [
    { label: 'Move to...', onClick: handleMoveTo },
    { label: 'Rename', onClick: handleRename },
    { label: 'Delete', onClick: handleDelete, danger: true },
  ];

  const loading = foldersLoading || worksLoading;

  return (
    <div className="p-6">
      <Breadcrumbs folders={folders} currentFolderId={folderId} />

      {/* Toolbar: search, sort, columns */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-60"
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="border rounded px-2 py-1.5 text-sm cursor-pointer"
        >
          <option value="updated_at">Last Updated</option>
          <option value="created_at">Date Created</option>
          <option value="title">Title</option>
        </select>
        <div className="flex items-center gap-3 ml-auto">
          <NewButtonDropdown
            onNewWork={() => setShowCreateWork(true)}
            onNewFolder={() => setShowCreateFolder(true)}
          />
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Columns</label>
            <input
              type="range"
              min={2}
              max={8}
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-xs text-gray-500 w-4 text-center">{columns}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : (
        <>
          {filteredFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
                />
              ))}
            </div>
          )}

          <WorksList
            works={filteredAndSortedWorks}
            loading={false}
            columns={columns}
            onContextMenu={handleWorkContextMenu}
          />
        </>
      )}

      {menu.visible && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={contextMenuItems}
          onClose={hideMenu}
        />
      )}

      {moveModalTarget && (
        <MoveToModal
          title={`Move "${moveModalTarget.name}"`}
          tree={tree}
          excludeId={moveModalTarget.type === 'folder' ? moveModalTarget.id : null}
          onConfirm={handleMoveConfirm}
          onCancel={() => setMoveModalTarget(null)}
        />
      )}

      {renameFolderTarget && (
        <RenameFolderDialog
          currentName={renameFolderTarget.name}
          onConfirm={handleRenameFolderConfirm}
          onCancel={() => setRenameFolderTarget(null)}
        />
      )}

      {renameWorkTarget && (
        <RenameWorkDialog
          currentTitle={renameWorkTarget.title}
          onConfirm={handleRenameWorkConfirm}
          onCancel={() => setRenameWorkTarget(null)}
        />
      )}

      {showCreateFolder && (
        <CreateFolderDialog
          onConfirm={handleCreateFolder}
          onCancel={() => setShowCreateFolder(false)}
        />
      )}

      {showCreateWork && (
        <CreateWorkDialog
          onConfirm={handleCreateWork}
          onCancel={() => setShowCreateWork(false)}
        />
      )}
    </div>
  );
}
