import { NextRequest, NextResponse } from 'next/server'
import { pdfService } from '@/app/lib/pdf/pdf-service'
import { PDF_CONFIG, PDFGenerationRequest } from '@/app/lib/pdf/pdf-config'
import { Logger } from '@/app/lib/utils/logger'

const logger = Logger.getInstance()

export async function POST(req: NextRequest) {
  try {
    const body: PDFGenerationRequest = await req.json()
    const { html, options, filename, styles, theme } = body

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    logger.info('Generating PDF from HTML content', { 
      hasCustomStyles: !!styles,
      theme 
    })

    const pdfBuffer = await pdfService.generatePDF(html, options, 'PDF', styles)
    const downloadFilename = filename || 'tiptap-export.pdf'

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': PDF_CONFIG.CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    logger.error('PDF generation failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}