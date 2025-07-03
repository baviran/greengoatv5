export interface ExtractedStyles {
  css: string
  theme: 'light' | 'dark'
  fonts: string[]
}

export class PDFStyleExtractor {
  private static instance: PDFStyleExtractor | null = null

  private constructor() {}

  public static getInstance(): PDFStyleExtractor {
    if (!PDFStyleExtractor.instance) {
      PDFStyleExtractor.instance = new PDFStyleExtractor()
    }
    return PDFStyleExtractor.instance
  }

  /**
   * Extract styles from the editor element and convert them to PDF-compatible CSS
   */
  public extractEditorStyles(editorElement: HTMLElement): ExtractedStyles {
    const theme = this.detectTheme()
    const computedStyles = this.getComputedStyles(editorElement)
    const cssVariables = this.extractCSSVariables()
    const fonts = this.extractFonts(editorElement)
    
    const css = this.generatePDFCSS(computedStyles, cssVariables, theme)
    
    return {
      css,
      theme,
      fonts
    }
  }

  /**
   * Detect current theme (light/dark)
   */
  private detectTheme(): 'light' | 'dark' {
    // Check if dark class exists on html or body
    const isDark = document.documentElement.classList.contains('dark') || 
                   document.body.classList.contains('dark')
    return isDark ? 'dark' : 'light'
  }

  /**
   * Get computed styles from editor element
   */
  private getComputedStyles(element: HTMLElement): CSSStyleDeclaration {
    return window.getComputedStyle(element)
  }

  /**
   * Extract CSS variables from document
   */
  private extractCSSVariables(): Record<string, string> {
    const variables: Record<string, string> = {}
    const rootStyles = window.getComputedStyle(document.documentElement)
    
    // Common TipTap variables to extract
    const variableNames = [
      '--tt-brand-color-400',
      '--tt-brand-color-500',
      '--tt-gray-light-900',
      '--tt-gray-light-a-200',
      '--tt-gray-light-a-400',
      '--tt-gray-light-a-600',
      '--tt-gray-light-a-700',
      '--tt-gray-light-a-800',
      '--tt-gray-dark-900',
      '--tt-gray-dark-a-200',
      '--tt-gray-dark-a-400',
      '--tt-gray-dark-a-600',
      '--tt-gray-dark-a-700',
      '--tt-gray-dark-a-800',
      '--tt-cursor-color',
      '--tt-selection-color',
      '--tt-bg-color',
      '--blockquote-bg-color',
      '--link-text-color',
      '--separator-color',
      '--thread-text',
      '--placeholder-color',
      '--tt-inline-code-bg-color',
      '--tt-inline-code-text-color',
      '--tt-inline-code-border-color',
      '--tt-codeblock-bg',
      '--tt-codeblock-text',
      '--tt-codeblock-border',
      // Checkbox/checklist variables
      '--tt-checklist-bg-color',
      '--tt-checklist-bg-active-color',
      '--tt-checklist-border-color',
      '--tt-checklist-border-active-color',
      '--tt-checklist-check-icon-color',
      '--tt-checklist-text-active',
    ]

    variableNames.forEach(name => {
      const value = rootStyles.getPropertyValue(name)
      if (value) {
        variables[name] = value.trim()
      }
    })

    return variables
  }

  /**
   * Extract font information from editor
   */
  private extractFonts(element: HTMLElement): string[] {
    const computedStyles = window.getComputedStyle(element)
    const fontFamily = computedStyles.fontFamily
    
    // Parse font family string into array
    const fonts = fontFamily.split(',').map(font => font.trim().replace(/['"]/g, ''))
    
    return fonts
  }

  /**
   * Generate PDF-compatible CSS from extracted styles
   */
  private generatePDFCSS(
    computedStyles: CSSStyleDeclaration,
    variables: Record<string, string>,
    theme: 'light' | 'dark'
  ): string {
    const css = `
/* PDF Styles - Generated from Editor */
body {
  font-family: ${computedStyles.fontFamily || '"DM Sans", sans-serif'};
  font-size: ${computedStyles.fontSize || '16px'};
  line-height: ${computedStyles.lineHeight || '1.7'};
  color: ${variables['--tt-gray-light-900'] || '#1f2937'};
  background-color: white;
  padding: 2rem;
  margin: 0;
  direction: rtl;
  text-align: right;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  color: ${variables['--tt-gray-light-900'] || '#111827'};
  font-weight: 700;
  margin: 2rem 0 1rem;
}

h1 {
  font-size: 1.5em;
  margin-top: 3em;
}

h2 {
  font-size: 1.25em;
  margin-top: 2.5em;
}

h3 {
  font-size: 1.125em;
  font-weight: 600;
  margin-top: 2em;
}

h4 {
  font-size: 1em;
  font-weight: 600;
  margin-top: 2em;
}

/* Paragraphs */
p {
  margin: 1rem 0;
  line-height: 1.6;
}

p:not(:first-child) {
  margin-top: 20px;
}

/* Links */
a {
  color: ${variables['--link-text-color'] || variables['--tt-brand-color-500'] || '#3b82f6'};
  text-decoration: underline;
}

/* Text formatting */
strong, b {
  font-weight: 700;
}

em, i {
  font-style: italic;
}

u {
  text-decoration: underline;
}

s {
  text-decoration: line-through;
}

/* Highlight (mark) */
mark {
  background-color: ${this.getHighlightColor(variables, theme)};
  padding: 0 0.2em;
  border-radius: 0.125rem;
}

/* Code */
code {
  background-color: ${variables['--tt-inline-code-bg-color'] || '#f3f4f6'};
  color: ${variables['--tt-inline-code-text-color'] || '#374151'};
  border: 1px solid ${variables['--tt-inline-code-border-color'] || '#e5e7eb'};
  font-family: "JetBrains Mono NL", monospace;
  font-size: 0.875em;
  line-height: 1.4;
  border-radius: 0.375rem;
  padding: 0.1em 0.2em;
}

/* Code blocks */
pre {
  background-color: ${variables['--tt-codeblock-bg'] || '#f9fafb'};
  color: ${variables['--tt-codeblock-text'] || '#374151'};
  border: 1px solid ${variables['--tt-codeblock-border'] || '#e5e7eb'};
  margin: 1.5em 0;
  padding: 1em;
  font-size: 1rem;
  border-radius: 0.375rem;
}

pre code {
  background-color: transparent;
  border: none;
  border-radius: 0;
  color: inherit;
  padding: 0;
}

/* Blockquotes */
blockquote {
  position: relative;
  padding-left: 1em;
  padding-top: 0.375em;
  padding-bottom: 0.375em;
  margin: 1.5rem 0;
  border-right: 4px solid ${variables['--blockquote-bg-color'] || '#e5e7eb'};
  background-color: ${theme === 'dark' ? '#1f2937' : '#f9fafb'};
}

blockquote p {
  margin-top: 0;
  margin-bottom: 0;
}

/* Lists */
ul, ol {
  margin: 1rem 0;
  padding-inline-start: 1.25rem;
}

li {
  margin: 0.5rem 0;
}

/* Task lists */
ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  padding-left: 0;
  flex-direction: row;
}

/* Custom styled checkboxes for PDF */
ul[data-type="taskList"] li label {
  position: relative;
  padding-top: 2px;
  padding-left: 0;
  margin-left: 0.75rem;
  margin-right: 0;
  display: flex;
  align-items: center;
}

ul[data-type="taskList"] input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

ul[data-type="taskList"] input[type="checkbox"] + span {
  display: block;
  width: 1em;
  height: 1em;
  border: 1px solid ${variables['--tt-checklist-border-color'] || '#d1d5db'};
  border-radius: 0.25rem;
  position: relative;
  cursor: pointer;
  background-color: ${variables['--tt-checklist-bg-color'] || '#f9fafb'};
  flex-shrink: 0;
}

ul[data-type="taskList"] input[type="checkbox"] + span::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0.75em;
  height: 0.75em;
  background-color: ${variables['--tt-checklist-check-icon-color'] || 'white'};
  opacity: 0;
  -webkit-mask: url("data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22currentColor%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.4142%204.58579C22.1953%205.36683%2022.1953%206.63317%2021.4142%207.41421L10.4142%2018.4142C9.63317%2019.1953%208.36684%2019.1953%207.58579%2018.4142L2.58579%2013.4142C1.80474%2012.6332%201.80474%2011.3668%202.58579%2010.5858C3.36683%209.80474%204.63317%209.80474%205.41421%2010.5858L9%2014.1716L18.5858%204.58579C19.3668%203.80474%2020.6332%203.80474%2021.4142%204.58579Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E") center/contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22currentColor%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.4142%204.58579C22.1953%205.36683%2022.1953%206.63317%2021.4142%207.41421L10.4142%2018.4142C9.63317%2019.1953%208.36684%2019.1953%207.58579%2018.4142L2.58579%2013.4142C1.80474%2012.6332%201.80474%2011.3668%202.58579%2010.5858C3.36683%209.80474%204.63317%209.80474%205.41421%2010.5858L9%2014.1716L18.5858%204.58579C19.3668%203.80474%2020.6332%203.80474%2021.4142%204.58579Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E") center/contain no-repeat;
}

ul[data-type="taskList"] input[type="checkbox"]:checked + span {
  background: ${variables['--tt-checklist-bg-active-color'] || '#1f2937'};
  border-color: ${variables['--tt-checklist-border-active-color'] || '#1f2937'};
}

ul[data-type="taskList"] input[type="checkbox"]:checked + span::before {
  opacity: 1;
}

ul[data-type="taskList"] li > div {
  flex: 1;
  min-width: 0;
  padding-right: 0.75rem;
}

/* Checked item text styling */
ul[data-type="taskList"] li[data-checked="true"] p {
  opacity: 0.5;
  text-decoration: line-through;
}

ul[data-type="taskList"] li[data-checked="true"] p span {
  text-decoration: line-through;
}

/* Horizontal rule */
hr {
  border: none;
  height: 1px;
  background-color: ${variables['--separator-color'] || '#e5e7eb'};
  margin: 3rem 0;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  margin: 2rem 0;
  border-radius: 0.25rem;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.06);
}

/* Page Breaks - PDF specific */
.page-break {
  page-break-before: always;
  page-break-after: avoid;
  page-break-inside: avoid;
  margin: 0 !important;
  padding: 0 !important;
  height: 0 !important;
  min-height: 0 !important;
  border: none !important;
  background: transparent !important;
  visibility: hidden !important;
}

.page-break .page-break-line,
.page-break .page-break-text {
  display: none !important;
}

/* Print optimizations */
@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page-break {
    page-break-before: always;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
}
`

    return css
  }

  /**
   * Get highlight color based on theme
   */
  private getHighlightColor(variables: Record<string, string>, theme: 'light' | 'dark'): string {
    // Try to get highlight color from variables first
    const highlightVar = theme === 'dark' ? '--tt-highlight-dark' : '--tt-highlight-light'
    return variables[highlightVar] || '#bbf7d0'
  }
}

export const pdfStyleExtractor = PDFStyleExtractor.getInstance() 