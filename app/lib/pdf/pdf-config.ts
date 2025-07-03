export const PDF_CONFIG = {
  // API Configuration
  API_ENDPOINT: '/api/generate-pdf',
  
  // File Configuration
  DEFAULT_FILENAME: 'document.pdf',
  CONTENT_TYPE: 'application/pdf',
  
  // PDF Generation Options
  PDF_OPTIONS: {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '20mm',
      right: '20mm',
    },
  },
  
  // Puppeteer Configuration
  BROWSER_OPTIONS: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] as string[],
  },
  
  // UI Text (Hebrew)
  UI_TEXT: {
    DOWNLOAD_LABEL: 'הורד כ-PDF',
    DOWNLOADING_LABEL: 'מוריד PDF...',
    ERROR_MESSAGE: 'שגיאה בהורדת ה-PDF',
    GENERATING_ERROR: 'PDF generation failed',
  },
} as const

export type PDFFormat = 'A4' | 'A3' | 'Letter'
export type PDFOptions = {
  format?: PDFFormat
  printBackground?: boolean
  margin?: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
}

export interface PDFGenerationRequest {
  html: string
  options?: PDFOptions
  filename?: string
} 