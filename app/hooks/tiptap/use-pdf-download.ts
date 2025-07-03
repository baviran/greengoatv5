import { useState, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { generateHTML } from '@tiptap/html'
import { getPDFExtensions } from '@/app/lib/tiptap/tiptap-extensions'
import { PDF_CONFIG, PDFGenerationRequest, PDFOptions } from '@/app/lib/pdf/pdf-config'
import { pdfStyleExtractor } from '@/app/lib/pdf/pdf-style-extractor'

export interface UsePDFDownloadOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  filename?: string
  pdfOptions?: PDFOptions
}

export interface UsePDFDownloadReturn {
  isDownloading: boolean
  downloadPDF: () => Promise<void>
  error: string | null
  clearError: () => void
}

export function usePDFDownload(
  editor: Editor | null,
  options: UsePDFDownloadOptions = {}
): UsePDFDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const downloadPDF = useCallback(async () => {
    if (!editor || isDownloading) return

    try {
      setIsDownloading(true)
      setError(null)
      
      // Get content and generate HTML
      const content = editor.getJSON()
      const html = generateHTML(content, getPDFExtensions())

      // Extract styles from the current editor
      const editorElement = editor.view.dom as HTMLElement
      const extractedStyles = pdfStyleExtractor.extractEditorStyles(editorElement)

      // Prepare API request
      const payload: PDFGenerationRequest = {
        html,
        options: options.pdfOptions,
        filename: options.filename,
        styles: extractedStyles.css,
        theme: extractedStyles.theme,
      }

      // Call API
      const response = await fetch(PDF_CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || PDF_CONFIG.UI_TEXT.GENERATING_ERROR)
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = options.filename || PDF_CONFIG.DEFAULT_FILENAME
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      options.onSuccess?.()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : PDF_CONFIG.UI_TEXT.ERROR_MESSAGE
      setError(errorMessage)
      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsDownloading(false)
    }
  }, [editor, isDownloading, options])

  return {
    isDownloading,
    downloadPDF,
    error,
    clearError,
  }
} 