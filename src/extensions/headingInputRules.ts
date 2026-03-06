import { Extension, textblockTypeInputRule } from '@tiptap/core'

export const HeadingInputRules = Extension.create({
  name: 'headingInputRules',

  addInputRules() {
    const headingType = this.editor.schema.nodes.heading
    return [
      textblockTypeInputRule({
        find: /^\/h([1-2])\s$/,
        type: headingType,
        getAttributes: match => ({ level: parseInt(match[1], 10) }),
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty || $from.parentOffset !== 0) return false
        // Only convert heading → paragraph when there's no indent to remove first
        const node = $from.parent
        if (node.type.name === 'heading' && (node.attrs.indent ?? 0) === 0) {
          return editor.commands.setParagraph()
        }
        return false
      },
    }
  },
})
