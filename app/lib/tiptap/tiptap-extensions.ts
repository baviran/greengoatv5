import { StarterKit } from "@tiptap/starter-kit"
import { TextAlign } from "@tiptap/extension-text-align"
import { Underline } from "@tiptap/extension-underline"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { Typography } from "@tiptap/extension-typography"
import { Link } from "@tiptap/extension-link"

// Shared TipTap extensions configuration
export const getTiptapExtensions = () => [
  StarterKit.configure({
    codeBlock: false,
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Underline,
  TaskList,
  TaskItem.configure({ nested: true }),
  Highlight.configure({ multicolor: true }),
  Image,
  Typography,
  Link.configure({ openOnClick: false }),
]

// Extensions specifically for HTML/PDF generation
export const getPDFExtensions = getTiptapExtensions 