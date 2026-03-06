import { Extension, wrappingInputRule } from '@tiptap/core'

export const ListInputRules = Extension.create({
  name: 'listInputRules',
  addInputRules() {
    const orderedListType = this.editor.schema.nodes.orderedList
    return [
      wrappingInputRule({
        find: /^(\d+)\)\s$/,
        type: orderedListType,
        getAttributes: match => ({ start: +match[1] }),
        joinPredicate: (match, node) => node.childCount + node.attrs.start === +match[1],
      }),
    ]
  },
})
