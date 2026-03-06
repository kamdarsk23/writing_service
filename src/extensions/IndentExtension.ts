import { Extension, type Editor } from '@tiptap/core'

const LIST_ITEM = 'listItem'
const MAX_INDENT = 4

function inListItem(editor: Editor): boolean {
  const { $from } = editor.state.selection
  return $from.depth >= 2 && $from.node($from.depth - 1).type.name === LIST_ITEM
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
    }
  }
}

export const IndentExtension = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const parsed = parseFloat(element.style.marginLeft)
              return isNaN(parsed) ? 0 : Math.round(parsed / 2)
            },
            renderHTML: attributes => {
              if (!attributes.indent) return {}
              return { style: `margin-left: ${attributes.indent * 2}em` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    const setIndent = (delta: 1 | -1) => ({ editor, commands }: { editor: Editor; commands: { updateAttributes: (type: string, attrs: Record<string, unknown>) => boolean } }) => {
      const node = editor.state.selection.$from.node()
      const indent = (node.attrs.indent ?? 0) + delta
      return indent >= 0 && indent <= MAX_INDENT
        ? commands.updateAttributes(node.type.name, { indent })
        : false
    }
    return {
      increaseIndent: () => setIndent(1),
      decreaseIndent: () => setIndent(-1),
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) =>
        inListItem(editor)
          ? editor.commands.sinkListItem(LIST_ITEM)
          : editor.commands.increaseIndent(),

      'Shift-Tab': ({ editor }) =>
        inListItem(editor)
          ? editor.commands.liftListItem(LIST_ITEM)
          : editor.commands.decreaseIndent(),

      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty || $from.parentOffset !== 0) return false
        if (inListItem(editor)) return editor.commands.liftListItem(LIST_ITEM)
        const indent = $from.parent.attrs.indent ?? 0
        return indent > 0 ? editor.commands.decreaseIndent() : false
      },
    }
  },
})
