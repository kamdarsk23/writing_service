import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorks } from '../hooks/useWorks';
import { EditorToolbar } from '../components/editor/EditorToolbar';
import { TitleInput } from '../components/editor/TitleInput';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function EditorPage() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const { fetchWork, updateWork } = useWorks();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<Record<string, unknown>>({});
  const loadedContentRef = useRef<Record<string, unknown>>({});

  const editor = useEditor({
    extensions: [StarterKit],
    content: {},
    onUpdate: ({ editor }) => {
      contentRef.current = editor.getJSON() as Record<string, unknown>;
    },
  });

  // Effect 1: Fetch work data (only depends on workId and fetchWork)
  useEffect(() => {
    if (!workId) return;
    setLoading(true);
    fetchWork(workId).then((work) => {
      if (work) {
        setTitle(work.title);
        contentRef.current = work.content;
        loadedContentRef.current = work.content;
      } else {
        navigate('/');
      }
      setLoading(false);
    });
  }, [workId, fetchWork, navigate]);

  // Effect 2: Sync loaded content into editor once editor is ready
  useEffect(() => {
    if (editor && !loading && Object.keys(loadedContentRef.current).length > 0) {
      editor.commands.setContent(loadedContentRef.current);
    }
  }, [editor, loading]);

  const handleSave = async () => {
    if (!workId) return;
    setSaving(true);
    await updateWork(workId, { title, content: contentRef.current });
    setSaving(false);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <TitleInput value={title} onChange={setTitle} />
      <EditorToolbar editor={editor} />
      <div className="prose max-w-none flex-1">
        <EditorContent editor={editor} className="min-h-[300px]" />
      </div>
    </div>
  );
}
