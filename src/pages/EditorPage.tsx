import { useEffect, useRef, useCallback, useReducer, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorks } from '../hooks/useWorks';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function EditorPage() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const { fetchWork, updateWork } = useWorks();
  const titleRef = useRef('');
  const contentRef = useRef<Record<string, unknown>>({});
  const loadedContentRef = useRef<Record<string, unknown>>({});
  const loadingRef = useRef(true);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: {},
    onUpdate: ({ editor }) => {
      contentRef.current = editor.getJSON() as Record<string, unknown>;
    },
  });

  useEffect(() => {
    if (!workId) return;
    loadingRef.current = true;
    forceRender();
    fetchWork(workId).then((work) => {
      if (work) {
        titleRef.current = work.title;
        contentRef.current = work.content;
        loadedContentRef.current = work.content;
      } else {
        navigate('/');
      }
      loadingRef.current = false;
      forceRender();
    });
  }, [workId, fetchWork, navigate]);

  useEffect(() => {
    if (editor && !loadingRef.current && Object.keys(loadedContentRef.current).length > 0) {
      editor.commands.setContent(loadedContentRef.current);
    }
  }, [editor, loadingRef.current]);

  const handleSave = useCallback(async () => {
    if (!workId) return;
    await updateWork(workId, { title: titleRef.current, content: contentRef.current });
    navigate('/');
  }, [workId, updateWork, navigate]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const [fontSize, setFontSize] = useState(1.2);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'd') {
        e.preventDefault();
        handleSave();
      }
      if (e.metaKey && e.key === 'e') {
        e.preventDefault();
        handleBack();
      }
      if (e.metaKey && e.key === '/') {
        e.preventDefault();
        setFontSize((prev) => Math.round((prev + 0.1) * 10) / 10);
      }
      if (e.metaKey && e.key === '.') {
        e.preventDefault();
        setFontSize((prev) => Math.round((Math.max(0.1, prev - 0.1)) * 10) / 10);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, handleBack]);

  // Click anywhere on the surface focuses the editor
  const handleSurfaceClick = () => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  };

  if (loadingRef.current) {
    return (
      <div className="h-screen flex items-center justify-center editor-surface">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen editor-surface" onClick={handleSurfaceClick} style={{ '--editor-font-size': `${fontSize}rem` } as React.CSSProperties}>
      <EditorContent editor={editor} className="h-screen" />
    </div>
  );
}
