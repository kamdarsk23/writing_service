import { useEffect, useRef, useState } from 'react';

interface NewButtonDropdownProps {
  onNewWork: () => void;
  onNewFolder: () => void;
}

export function NewButtonDropdown({ onNewWork, onNewFolder }: NewButtonDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white rounded px-3 py-1 text-sm"
      >
        + New
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow-lg py-1 z-50 min-w-[140px]">
          <button
            onClick={() => {
              onNewFolder();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            New Folder
          </button>
          <button
            onClick={() => {
              onNewWork();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            New Work
          </button>
        </div>
      )}
    </div>
  );
}
