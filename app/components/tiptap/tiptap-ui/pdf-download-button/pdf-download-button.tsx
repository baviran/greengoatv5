"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"
import { generateHTML } from '@tiptap/html'

// --- Hooks ---
import { useTiptapEditor } from "@/app/hooks/tiptap/use-tiptap-editor"

// --- Icons ---
import { DownloadIcon } from "@/app/components/tiptap/tiptap-icons/download-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/app/components/tiptap/tiptap-ui-primitive/button"
import { Button } from "@/app/components/tiptap/tiptap-ui-primitive/button"

// Extensions for HTML generation
import { StarterKit } from "@tiptap/starter-kit"
import { TextAlign } from "@tiptap/extension-text-align"
import { Underline } from "@tiptap/extension-underline"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { Typography } from "@tiptap/extension-typography"
import { Link } from "@tiptap/extension-link"

const extensions = [
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

export interface PDFDownloadButtonProps extends Omit<ButtonProps, "type"> {
  /**
   * The TipTap editor instance.
   */
  editor?: Editor | null
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Whether the button should be disabled.
   */
  disabled?: boolean
}

export function usePDFDownloadState(
  editor: Editor | null,
  disabled?: boolean
) {
  const [isDownloading, setIsDownloading] = React.useState(false)

  const handleDownload = React.useCallback(async () => {
    if (!editor || isDownloading) return

    try {
      setIsDownloading(true)
      
      // Get the current content from the editor
      const content = editor.getJSON()
      
      // Generate HTML from the content
      const html = generateHTML(content, extensions)

      // Call the PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      })

      if (!response.ok) {
        throw new Error('PDF generation failed')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'document.pdf'
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('PDF download failed:', error)
      alert('שגיאה בהורדת ה-PDF')
    } finally {
      setIsDownloading(false)
    }
  }, [editor, isDownloading])

  const isDisabled = !editor || disabled || isDownloading
  const label = isDownloading ? "מוריד PDF..." : "הורד כ-PDF"

  return {
    isDisabled,
    isDownloading,
    handleDownload,
    label,
  }
}

export const PDFDownloadButton = React.forwardRef<
  HTMLButtonElement,
  PDFDownloadButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      disabled,
      className = "",
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)

    const { isDisabled, isDownloading, handleDownload, label } = usePDFDownloadState(
      editor,
      disabled
    )

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)

        if (!e.defaultPrevented && !isDisabled) {
          handleDownload()
        }
      },
      [onClick, isDisabled, handleDownload]
    )

    if (!editor || !editor.isEditable) {
      return null
    }

    return (
      <Button
        type="button"
        className={className.trim()}
        disabled={isDisabled}
        data-style="ghost"
        data-disabled={isDisabled}
        role="button"
        tabIndex={-1}
        aria-label={label}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children || (
          <>
            <DownloadIcon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>
    )
  }
)

PDFDownloadButton.displayName = "PDFDownloadButton"

export default PDFDownloadButton 