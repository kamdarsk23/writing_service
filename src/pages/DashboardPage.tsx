import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFolders } from '../hooks/useFolders';
import { useWorks } from '../hooks/useWorks';
import { useQTrees } from '../hooks/useQTrees';
import { useContextMenu } from '../hooks/useContextMenu';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { FolderCard } from '../components/dashboard/FolderCard';
import { ContextMenu } from '../components/dashboard/ContextMenu';
import { MoveToModal } from '../components/dashboard/MoveToModal';
import { WorkCard } from '../components/works/WorkCard';
import { QTreeCard } from '../components/qtree/QTreeCard';
import { RenameFolderDialog } from '../components/folders/RenameFolderDialog';
import { RenameWorkDialog } from '../components/works/RenameWorkDialog';
import { RenameQTreeDialog } from '../components/qtree/RenameQTreeDialog';
import { CreateFolderDialog } from '../components/folders/CreateFolderDialog';
import { CreateWorkDialog } from '../components/works/CreateWorkDialog';
import { CreateQTreeDialog } from '../components/qtree/CreateQTreeDialog';
import { NewButtonDropdown } from '../components/layout/NewButtonDropdown';
import type { Work, QTreeRoot } from '../types';

type SortKey = 'updated_at' | 'created_at' | 'title';

type CombinedItem =
  | { kind: 'work'; item: Work }
  | { kind: 'qtree'; item: QTreeRoot };

function sortCombined(items: CombinedItem[], key: SortKey): CombinedItem[] {
  return [...items].sort((a, b) => {
    if (key === 'title') {
      const nameA = a.kind === 'work' ? a.item.title : a.item.question;
      const nameB = b.kind === 'work' ? b.item.title : b.item.question;
      return nameA.localeCompare(nameB);
    }
    const dateA = new Date(a.item[key]).getTime();
    const dateB = new Date(b.item[key]).getTime();
    return dateB - dateA;
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
  const {
    qtrees,
    loading: qtreesLoading,
    fetchQTrees,
    createQTreeRoot,
    deleteQTreeRoot,
    moveQTree,
    renameQTreeRoot,
  } = useQTrees();
  const { menu, show: showMenu, hide: hideMenu } = useContextMenu();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [columns, setColumns] = useState(6);

  const [moveModalTarget, setMoveModalTarget] = useState<{
    id: string;
    type: 'folder' | 'work' | 'qtree';
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
  const [renameQTreeTarget, setRenameQTreeTarget] = useState<{
    id: string;
    question: string;
  } | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateWork, setShowCreateWork] = useState(false);
  const [showCreateQTree, setShowCreateQTree] = useState(false);

  const refetch = useCallback(() => {
    fetchFolders();
    fetchWorks(folderId ?? null);
    fetchQTrees(folderId ?? null);
  }, [fetchFolders, fetchWorks, fetchQTrees, folderId]);

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

  const combinedItems = useMemo((): CombinedItem[] => {
    const workItems: CombinedItem[] = (
      query ? works.filter((w) => w.title.toLowerCase().includes(query)) : works
    ).map((w) => ({ kind: 'work', item: w }));

    const qtreeItems: CombinedItem[] = (
      query ? qtrees.filter((q) => q.question.toLowerCase().includes(query)) : qtrees
    ).map((q) => ({ kind: 'qtree', item: q }));

    return sortCombined([...workItems, ...qtreeItems], sortKey);
  }, [works, qtrees, query, sortKey]);

  const handleFolderContextMenu = (e: React.MouseEvent, id: string) => {
    showMenu(e, id, 'folder');
  };

  const handleWorkContextMenu = (e: React.MouseEvent, workId: string) => {
    showMenu(e, workId, 'work');
  };

  const handleQTreeContextMenu = (e: React.MouseEvent, qtreeId: string) => {
    showMenu(e, qtreeId, 'qtree');
  };

  const handleDelete = async () => {
    if (!menu.targetId || !menu.targetType) return;
    if (menu.targetType === 'folder') {
      await deleteFolder(menu.targetId);
    } else if (menu.targetType === 'work') {
      await deleteWork(menu.targetId);
    } else {
      await deleteQTreeRoot(menu.targetId);
    }
    refetch();
  };

  const handleMoveTo = () => {
    if (!menu.targetId || !menu.targetType) return;
    let name = 'item';
    if (menu.targetType === 'folder') {
      name = folders.find((f) => f.id === menu.targetId)?.name ?? 'item';
    } else if (menu.targetType === 'work') {
      name = works.find((w) => w.id === menu.targetId)?.title ?? 'item';
    } else {
      name = qtrees.find((q) => q.id === menu.targetId)?.question ?? 'item';
    }
    setMoveModalTarget({ id: menu.targetId, type: menu.targetType, name });
  };

  const handleMoveConfirm = async (destinationId: string | null) => {
    if (!moveModalTarget) return;
    if (moveModalTarget.type === 'folder') {
      await moveFolder(moveModalTarget.id, destinationId);
    } else if (moveModalTarget.type === 'work') {
      await moveWork(moveModalTarget.id, destinationId);
    } else {
      await moveQTree(moveModalTarget.id, destinationId);
    }
    setMoveModalTarget(null);
    refetch();
  };

  const handleRename = () => {
    if (!menu.targetId || !menu.targetType) return;
    if (menu.targetType === 'folder') {
      const folder = folders.find((f) => f.id === menu.targetId);
      if (folder) setRenameFolderTarget({ id: folder.id, name: folder.name });
    } else if (menu.targetType === 'work') {
      const work = works.find((w) => w.id === menu.targetId);
      if (work) setRenameWorkTarget({ id: work.id, title: work.title });
    } else {
      const qtree = qtrees.find((q) => q.id === menu.targetId);
      if (qtree) setRenameQTreeTarget({ id: qtree.id, question: qtree.question });
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

  const handleRenameQTreeConfirm = async (newQuestion: string) => {
    if (!renameQTreeTarget) return;
    await renameQTreeRoot(renameQTreeTarget.id, newQuestion);
    setRenameQTreeTarget(null);
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

  const handleCreateQTree = async (question: string) => {
    const root = await createQTreeRoot(question, folderId ?? null);
    setShowCreateQTree(false);
    if (root) {
      navigate(`/qtree/${root.id}`);
    }
  };

  const contextMenuItems = [
    { label: 'Move to...', onClick: handleMoveTo },
    { label: 'Rename', onClick: handleRename },
    { label: 'Delete', onClick: handleDelete, danger: true },
  ];

  const loading = foldersLoading || worksLoading || qtreesLoading;

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
            onNewQTree={() => setShowCreateQTree(true)}
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

          {combinedItems.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nothing here yet.</p>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {combinedItems.map((entry) =>
                entry.kind === 'work' ? (
                  <WorkCard
                    key={entry.item.id}
                    work={entry.item}
                    onContextMenu={(e) => handleWorkContextMenu(e, entry.item.id)}
                  />
                ) : (
                  <QTreeCard
                    key={entry.item.id}
                    qtree={entry.item}
                    onContextMenu={(e) => handleQTreeContextMenu(e, entry.item.id)}
                  />
                ),
              )}
            </div>
          )}
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

      {renameQTreeTarget && (
        <RenameQTreeDialog
          currentQuestion={renameQTreeTarget.question}
          onConfirm={handleRenameQTreeConfirm}
          onCancel={() => setRenameQTreeTarget(null)}
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

      {showCreateQTree && (
        <CreateQTreeDialog
          onConfirm={handleCreateQTree}
          onCancel={() => setShowCreateQTree(false)}
        />
      )}
    </div>
  );
}
