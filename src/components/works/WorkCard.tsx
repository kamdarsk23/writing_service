import { useNavigate } from 'react-router-dom';
import type { Work } from '../../types';

interface WorkCardProps {
  work: Work;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function WorkCard({ work, onContextMenu }: WorkCardProps) {
  const navigate = useNavigate();

  const formattedDate = new Date(work.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => navigate(`/work/${work.id}`)}
      onContextMenu={onContextMenu}
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md hover:scale-105 transition-all flex flex-col justify-between min-h-[120px]"
      style={{ backgroundColor: '#9e8f98' }}
    >
      <h3 className="font-medium text-sm truncate text-white">{work.title}</h3>
      <p className="text-xs text-gray-200 mt-2">Updated {formattedDate}</p>
    </div>
  );
}
