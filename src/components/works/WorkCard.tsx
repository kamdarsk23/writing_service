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
      className="border rounded p-3 cursor-pointer hover:bg-gray-50"
    >
      <h3 className="font-medium">{work.title}</h3>
      <p className="text-xs text-gray-400 mt-1">Updated {formattedDate}</p>
    </div>
  );
}
