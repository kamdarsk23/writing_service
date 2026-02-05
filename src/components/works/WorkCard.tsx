import { useNavigate } from 'react-router-dom';
import type { Work } from '../../types';

interface WorkCardProps {
  work: Work;
  onDelete: (id: string) => void;
}

export function WorkCard({ work, onDelete }: WorkCardProps) {
  const navigate = useNavigate();

  const formattedDate = new Date(work.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => navigate(`/work/${work.id}`)}
      className="border rounded p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-start"
    >
      <div>
        <h3 className="font-medium">{work.title}</h3>
        <p className="text-xs text-gray-400 mt-1">Updated {formattedDate}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(work.id);
        }}
        className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
      >
        Delete
      </button>
    </div>
  );
}
