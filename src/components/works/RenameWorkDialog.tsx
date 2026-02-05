import { useState, type FormEvent } from 'react';

interface RenameWorkDialogProps {
  currentTitle: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

export function RenameWorkDialog({ currentTitle, onConfirm, onCancel }: RenameWorkDialogProps) {
  const [title, setTitle] = useState(currentTitle);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onConfirm(title.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 w-72">
        <h3 className="font-semibold mb-2">Rename Work</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="border rounded px-2 py-1 w-full mb-3"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-3 py-1 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Rename
          </button>
        </div>
      </form>
    </div>
  );
}
