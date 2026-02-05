import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorks } from '../hooks/useWorks';
import { WorksList } from '../components/works/WorksList';

export function DashboardPage() {
  const { folderId } = useParams();
  const { works, loading, fetchWorks, deleteWork } = useWorks();

  useEffect(() => {
    if (folderId) {
      fetchWorks(folderId);
    } else {
      fetchWorks();
    }
  }, [folderId, fetchWorks]);

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-lg font-semibold mb-4">
        {folderId ? 'Folder Works' : 'All Works'}
      </h2>
      <WorksList works={works} loading={loading} onDelete={deleteWork} />
    </div>
  );
}
