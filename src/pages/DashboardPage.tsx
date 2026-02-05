import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFolders } from '../hooks/useFolders';
import { useWorks } from '../hooks/useWorks';
import { useContextMenu } from '../hooks/useContextMenu';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { FolderCard } from '../components/dashboard/FolderCard';
import { ContextMenu } from '../components/dashboard/ContextMenu';
import { MoveToModal } from '../components/dashboard/MoveToModal';
import { WorksList } from '../components/works/WorksList';
import { RenameFolderDialog } from '../components/folders/RenameFolderDialog';

export function DashboardPage() {
  const { folderId } = useParams();
  const {
    folders,
    tree,
    loading: foldersLoading,
    fetchFolders,
    getChildFolders,
    renameFolder,
    deleteFolder,
    moveFolder,
  } = useFolders();
  const { works, loading: worksLoading, fetchWorks, deleteWork, moveWork } = useWorks();
  const { menu, show: showMenu, hide: hideMenu } = useContextMenu();

  const [moveModalTarget, setMoveModalTarget] = useState<{
    id: string;
    type: 'folder' | 'work';
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const refetch = useCallback(() => {
    fetchFolders();
    fetchWorks(folderId ?? null);
  }, [fetchFolders, fetchWorks, folderId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('refetch-dashboard', handler);
    return () => window.removeEventListener('refetch-dashboard', handler);
  }, [refetch]);

  const childFolders = getChildFolders(folderId ?? null);

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
    if (!menu.targetId) return;
    const folder = folders.find((f) => f.id === menu.targetId);
    if (folder) {
      setRenameTarget({ id: folder.id, name: folder.name });
    }
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!renameTarget) return;
    await renameFolder(renameTarget.id, newName);
    setRenameTarget(null);
    refetch();
  };

  const contextMenuItems =
    menu.targetType === 'folder'
      ? [
          { label: 'Move to...', onClick: handleMoveTo },
          { label: 'Rename', onClick: handleRename },
          { label: 'Delete', onClick: handleDelete, danger: true },
        ]
      : [
          { label: 'Move to...', onClick: handleMoveTo },
          { label: 'Delete', onClick: handleDelete, danger: true },
        ];

  const loading = foldersLoading || worksLoading;

  return (
    <div className="p-6 max-w-3xl">
      <Breadcrumbs folders={folders} currentFolderId={folderId} />

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : (
        <>
          {childFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {childFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
                />
              ))}
            </div>
          )}

          <WorksList
            works={works}
            loading={false}
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

      {renameTarget && (
        <RenameFolderDialog
          currentName={renameTarget.name}
          onConfirm={handleRenameConfirm}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
}
