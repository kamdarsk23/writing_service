import type { Work } from '../../types';
import { EmptyState } from './EmptyState';
import { WorkCard } from './WorkCard';

interface WorksListProps {
  works: Work[];
  loading: boolean;
  onContextMenu?: (e: React.MouseEvent, workId: string) => void;
}

export function WorksList({ works, loading, onContextMenu }: WorksListProps) {
  if (loading) {
    return <p className="text-gray-400 text-center py-8">Loading works...</p>;
  }

  if (works.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-2">
      {works.map((work) => (
        <WorkCard
          key={work.id}
          work={work}
          onContextMenu={onContextMenu ? (e) => onContextMenu(e, work.id) : undefined}
        />
      ))}
    </div>
  );
}
