import { useState, type FormEvent } from 'react';

interface CreateQTreeDialogProps {
  onConfirm: (question: string) => void;
  onCancel: () => void;
}

export function CreateQTreeDialog({ onConfirm, onCancel }: CreateQTreeDialogProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onConfirm(question.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 w-72">
        <h3 className="font-semibold mb-2">New Q Tree</h3>
        <input
          type="text"
          placeholder="Enter your first question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
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
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
