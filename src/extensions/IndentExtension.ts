import { Extension } from '@tiptap/core'

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
              const ml = element.style.marginLeft
              if (!ml) return 0
              const parsed = parseFloat(ml)
              return isNaN(parsed) ? 0 : Math.round(parsed / 2)
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent === 0) return {}
              return { style: `margin-left: ${attributes.indent * 2}em` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      increaseIndent: () => ({ editor, commands }) => {
        const { $from } = editor.state.selection
        const node = $from.node()
        const currentIndent = node.attrs.indent ?? 0
        if (currentIndent >= 4) return false
        return commands.updateAttributes(node.type.name, { indent: currentIndent + 1 })
      },
      decreaseIndent: () => ({ editor, commands }) => {
        const { $from } = editor.state.selection
        const node = $from.node()
        const currentIndent = node.attrs.indent ?? 0
        if (currentIndent <= 0) return false
        return commands.updateAttributes(node.type.name, { indent: currentIndent - 1 })
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { $from } = editor.state.selection
        const parentType = $from.parent.type.name

        // In a list item, let StarterKit handle sinking
        if (parentType === 'listItem') return false

        return editor.commands.increaseIndent()
      },
      'Shift-Tab': ({ editor }) => {
        const { $from } = editor.state.selection
        const parentType = $from.parent.type.name

        if (parentType === 'listItem') return false

        return editor.commands.decreaseIndent()
      },
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty) return false

        const node = $from.parent
        const currentIndent = node.attrs.indent ?? 0

        // Only intercept if cursor is at start of node and indent > 0
        if ($from.parentOffset === 0 && currentIndent > 0) {
          return editor.commands.decreaseIndent()
        }
        return false
      },
    }
  },
})
