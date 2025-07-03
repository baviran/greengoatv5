import { Node, mergeAttributes } from '@tiptap/core'

export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insert a page break
       */
      setPageBreak: () => ReturnType
    }
  }
}

export const PageBreak = Node.create<PageBreakOptions>({
  name: 'pageBreak',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'page-break',
          class: 'page-break',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        'div',
        { class: 'page-break-line' },
      ],
      [
        'div',
        { class: 'page-break-text' },
        'Page Break',
      ],
    ]
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    }
  },
}) 