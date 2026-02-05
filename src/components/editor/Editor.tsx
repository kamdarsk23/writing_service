import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface EditorProps {
  content: Record<string, unknown>;
  onUpdate: (json: Record<string, unknown>) => void;
}

export function Editor({ content, onUpdate }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (editor && content && Object.keys(content).length > 0) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  return (
    <div className="prose max-w-none flex-1">
      <EditorContent editor={editor} className="min-h-[300px]" />
    </div>
  );
}
