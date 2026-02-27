import { useEffect, useRef, useCallback, useReducer, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQTrees } from '../hooks/useQTrees';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function QTreeEditorPage() {
  const { rootId, nodeId } = useParams<{ rootId: string; nodeId: string }>();
  const navigate = useNavigate();
  const { fetchQTreeRoot, fetchQTreeNode, updateQTreeRoot, updateQTreeNode } = useQTrees();

  const isRoot = nodeId === 'root';

  const questionRef = useRef('');
  const answerRef = useRef<Record<string, unknown>>({});
  const loadedAnswerRef = useRef<Record<string, unknown>>({});
  const folderIdRef = useRef<string | null>(null);
  const loadingRef = useRef(true);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const [fontSize, setFontSize] = useState(1.2);

  const editor = useEditor({
    extensions: [StarterKit],
    content: {},
    onUpdate: ({ editor }) => {
      answerRef.current = editor.getJSON() as Record<string, unknown>;
    },
  });

  useEffect(() => {
    if (!rootId || !nodeId) return;
    loadingRef.current = true;
    forceRender();

    if (isRoot) {
      fetchQTreeRoot(rootId).then((root) => {
        if (root) {
          questionRef.current = root.question;
          answerRef.current = root.answer;
          loadedAnswerRef.current = root.answer;
          folderIdRef.current = root.folder_id;
        } else {
          navigate('/');
        }
        loadingRef.current = false;
        forceRender();
      });
    } else {
      fetchQTreeNode(nodeId!).then((node) => {
        if (node) {
          questionRef.current = node.question;
          answerRef.current = node.answer;
          loadedAnswerRef.current = node.answer;
        } else {
          navigate(`/qtree/${rootId}`);
        }
        loadingRef.current = false;
        forceRender();
      });
    }
  }, [rootId, nodeId, isRoot, fetchQTreeRoot, fetchQTreeNode, navigate]);

  useEffect(() => {
    if (editor && !loadingRef.current && Object.keys(loadedAnswerRef.current).length > 0) {
      editor.commands.setContent(loadedAnswerRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, loadingRef.current]);

  const handleSave = useCallback(async () => {
    if (!rootId || !nodeId) return;
    if (isRoot) {
      await updateQTreeRoot(rootId, {
        question: questionRef.current,
        answer: answerRef.current,
      });
    } else {
      await updateQTreeNode(nodeId, {
        question: questionRef.current,
        answer: answerRef.current,
      });
    }
    navigate(`/qtree/${rootId}`);
  }, [rootId, nodeId, isRoot, updateQTreeRoot, updateQTreeNode, navigate]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
        setFontSize((prev) => Math.round(Math.max(0.1, prev - 0.1) * 10) / 10);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, handleBack]);

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
    <div
      className="h-screen flex flex-col editor-surface"
      style={{ '--editor-font-size': `${fontSize}rem` } as React.CSSProperties}
      onClick={handleSurfaceClick}
    >
      {/* Question row — use key to remount once after load so ref callback fires */}
      <div
        className="px-8 pt-8 pb-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          key="question-editor"
          contentEditable
          suppressContentEditableWarning
          ref={(node) => {
            // Set initial text imperatively; avoids dangerouslySetInnerHTML re-setting content on re-render
            if (node && node.innerText !== questionRef.current && !node.getAttribute('data-initialized')) {
              node.innerText = questionRef.current;
              node.setAttribute('data-initialized', '1');
            }
          }}
          onInput={(e) => {
            questionRef.current = (e.target as HTMLDivElement).innerText;
          }}
          className="text-2xl font-semibold outline-none text-gray-800"
          style={{ minHeight: '1.5em' }}
        />
        <div className="mt-2 border-b border-gray-200" />
      </div>

      {/* Answer area */}
      <div className="flex-1 overflow-auto px-8 py-4">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
}
