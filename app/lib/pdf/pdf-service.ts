import puppeteer, { Browser, Page } from 'puppeteer'
import { PDF_CONFIG, PDFOptions } from './pdf-config'
import { generatePDFHTML } from './pdf-styles'
import { Logger } from '@/app/lib/utils/logger'

const logger = Logger.getInstance()

export class PDFService {
  private static instance: PDFService | null = null
  private browser: Browser | null = null

  private constructor() {}

  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService()
    }
    return PDFService.instance
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      logger.info('Launching new browser instance')
      this.browser = await puppeteer.launch(PDF_CONFIG.BROWSER_OPTIONS)
    }
    return this.browser
  }

  private async createPage(): Promise<Page> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    
    // Set default page options
    await page.setViewport({ width: 1024, height: 768 })
    
    return page
  }

  public async generatePDF(
    html: string, 
    options: PDFOptions = {},
    title: string = 'PDF',
    customStyles?: string
  ): Promise<Buffer> {
    let page: Page | null = null
    
    try {
      logger.info('Starting PDF generation')
      
      page = await this.createPage()
      
      const fullHtml = generatePDFHTML(html, title, customStyles)
      
      await page.setContent(fullHtml, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      })

      const pdfOptions = {
        ...PDF_CONFIG.PDF_OPTIONS,
        ...options,
      }

      logger.info(`Generating PDF with options: ${JSON.stringify(pdfOptions)}`)
      
      const pdfBuffer = await page.pdf(pdfOptions)
      
      logger.info('PDF generation completed successfully')
      
      return Buffer.from(pdfBuffer)

    } catch (error) {
      logger.error('PDF generation failed:', error)
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  public async cleanup(): Promise<void> {
    if (this.browser) {
      logger.info('Closing browser instance')
      await this.browser.close()
      this.browser = null
    }
  }

  // Graceful shutdown handler
  public setupGracefulShutdown(): void {
    const shutdown = async () => {
      logger.info('Received shutdown signal, cleaning up...')
      await this.cleanup()
      process.exit(0)
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception:', error)
      await this.cleanup()
      process.exit(1)
    })
  }
}

export const pdfService = PDFService.getInstance() 