import { useNavigate } from 'react-router-dom';
import type { Folder } from '../../types';

interface FolderCardProps {
  folder: Folder;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function FolderCard({ folder, onContextMenu }: FolderCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/folder/${folder.id}`)}
      onContextMenu={onContextMenu}
      className="border rounded p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2"
    >
      <span className="text-lg">📁</span>
      <span className="font-medium truncate">{folder.name}</span>
    </div>
  );
}
