import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ListInputRules } from '../extensions/listInputRules';
import { IndentExtension } from '../extensions/IndentExtension';
import { HeadingInputRules } from '../extensions/headingInputRules';

const editorExtensions = [StarterKit, ListInputRules, IndentExtension, HeadingInputRules];

const EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export function FreePadPage() {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(1.2);

  const editor = useEditor({
    extensions: editorExtensions,
    content: EMPTY_DOC,
  });

  const handleExit = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Swallow save so the browser does not offer to save the page. Nothing is stored.
      if ((e.metaKey && e.key === 'd') || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
      }
      if ((e.metaKey && e.key === 'e') || (e.ctrlKey && e.key === 'l')) {
        e.preventDefault();
        handleExit();
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
  }, [handleExit]);

  useEffect(() => {
    editor?.commands.focus('end');
  }, [editor]);

  const handleSurfaceClick = () => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  };

  return (
    <div
      className="h-screen editor-surface"
      onClick={handleSurfaceClick}
      style={{ '--editor-font-size': `${fontSize}rem` } as React.CSSProperties}
    >
      <EditorContent editor={editor} className="h-screen" />
    </div>
  );
}
