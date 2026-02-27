import { useNavigate } from 'react-router-dom';
import type { QTreeRoot } from '../../types';

interface QTreeCardProps {
  qtree: QTreeRoot;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function QTreeCard({ qtree, onContextMenu }: QTreeCardProps) {
  const navigate = useNavigate();

  const formattedDate = new Date(qtree.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => navigate(`/qtree/${qtree.id}`)}
      onContextMenu={onContextMenu}
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md hover:scale-105 transition-all flex flex-col justify-between min-h-[120px]"
      style={{ backgroundColor: '#9e8f98' }}
    >
      <div className="flex items-start gap-1.5">
        <span className="text-white text-sm flex-shrink-0">🌿</span>
        <h3 className="font-medium text-sm truncate text-white">{qtree.question}</h3>
      </div>
      <p className="text-xs text-gray-200 mt-2">Updated {formattedDate}</p>
    </div>
  );
}
