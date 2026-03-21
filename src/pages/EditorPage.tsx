import { useEffect, useRef, useCallback, useReducer, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorks } from '../hooks/useWorks';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ListInputRules } from '../extensions/listInputRules';
import { IndentExtension } from '../extensions/IndentExtension';
import { HeadingInputRules } from '../extensions/headingInputRules';

const editorExtensions = [StarterKit, ListInputRules, IndentExtension, HeadingInputRules];

/** Valid empty TipTap doc; `{}` from DB or `content: {}` breaks ProseMirror ("Unknown node type: undefined"). */
const EMPTY_DOC: Record<string, unknown> = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function sanitizeTipTapContent(raw: Record<string, unknown>): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || raw.type !== 'doc' || !Array.isArray(raw.content)) {
    return { ...EMPTY_DOC };
  }
  for (const node of raw.content) {
    if (!node || typeof node !== 'object' || typeof (node as { type?: unknown }).type !== 'string') {
      return { ...EMPTY_DOC };
    }
  }
  return raw;
}

export function EditorPage() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const { fetchWork, updateWork } = useWorks();
  const titleRef = useRef('');
  const contentRef = useRef<Record<string, unknown>>({ ...EMPTY_DOC });
  const loadedContentRef = useRef<Record<string, unknown>>({ ...EMPTY_DOC });
  const folderIdRef = useRef<string | null>(null);
  const loadingRef = useRef(true);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  const editor = useEditor({
    extensions: editorExtensions,
    content: { ...EMPTY_DOC },
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
        const safe = sanitizeTipTapContent(
          (work.content ?? {}) as Record<string, unknown>,
        );
        contentRef.current = safe;
        loadedContentRef.current = safe;
        folderIdRef.current = work.folder_id;
      } else {
        navigate('/');
      }
      loadingRef.current = false;
      forceRender();
    });
  }, [workId, fetchWork, navigate]);

  useEffect(() => {
    if (!editor || loadingRef.current) return;
    const doc = loadedContentRef.current;
    try {
      editor.commands.setContent(doc);
    } catch {
      editor.commands.setContent({ ...EMPTY_DOC });
    }
  }, [editor, loadingRef.current]);

  const handleSave = useCallback(async () => {
    if (!workId) return;
    await updateWork(workId, { title: titleRef.current, content: contentRef.current });
    navigate(folderIdRef.current ? `/folder/${folderIdRef.current}` : '/');
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
