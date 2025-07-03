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

// --- Configuration ---
import { getPDFExtensions } from "@/app/lib/tiptap/tiptap-extensions"
import { PDF_CONFIG, PDFGenerationRequest } from "@/app/lib/pdf/pdf-config"

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
      const html = generateHTML(content, getPDFExtensions())

      // Call the PDF generation API
      const payload: PDFGenerationRequest = { html }
      const response = await fetch(PDF_CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || PDF_CONFIG.UI_TEXT.GENERATING_ERROR)
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = PDF_CONFIG.DEFAULT_FILENAME
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('PDF download failed:', error)
      const errorMessage = error instanceof Error ? error.message : PDF_CONFIG.UI_TEXT.ERROR_MESSAGE
      alert(errorMessage)
    } finally {
      setIsDownloading(false)
    }
  }, [editor, isDownloading])

  const isDisabled = !editor || disabled || isDownloading
  const label = isDownloading ? PDF_CONFIG.UI_TEXT.DOWNLOADING_LABEL : PDF_CONFIG.UI_TEXT.DOWNLOAD_LABEL

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