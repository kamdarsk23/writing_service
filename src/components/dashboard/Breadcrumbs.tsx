import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Folder } from '../../types';

interface BreadcrumbsProps {
  folders: Folder[];
  currentFolderId?: string;
}

export function Breadcrumbs({ folders, currentFolderId }: BreadcrumbsProps) {
  const path = useMemo(() => {
    if (!currentFolderId) return [];
    const crumbs: Folder[] = [];
    let current = folders.find((f) => f.id === currentFolderId);
    while (current) {
      crumbs.unshift(current);
      current = current.parent_id
        ? folders.find((f) => f.id === current!.parent_id)
        : undefined;
    }
    return crumbs;
  }, [folders, currentFolderId]);

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      {!currentFolderId ? (
        <span className="font-semibold text-gray-900">All Works</span>
      ) : (
        <Link to="/" className="hover:underline">
          All Works
        </Link>
      )}
      {path.map((folder, i) => (
        <span key={folder.id} className="flex items-center gap-1">
          <span>/</span>
          {i === path.length - 1 ? (
            <span className="font-semibold text-gray-900">{folder.name}</span>
          ) : (
            <Link to={`/folder/${folder.id}`} className="hover:underline">
              {folder.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
