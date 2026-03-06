import { Extension, textblockTypeInputRule } from '@tiptap/core'

export const HeadingInputRules = Extension.create({
  name: 'headingInputRules',

  addInputRules() {
    const headingType = this.editor.schema.nodes.heading
    return [
      textblockTypeInputRule({
        find: /^\/h([1-2])\s$/,
        type: headingType,
        getAttributes: match => ({ level: parseInt(match[1]) }),
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty) return false

        const node = $from.parent
        if (node.type.name === 'heading' && $from.parentOffset === 0) {
          return editor.commands.setParagraph()
        }
        return false
      },
    }
  },
})
