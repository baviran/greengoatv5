import { NextRequest, NextResponse } from 'next/server'
import { pdfService } from '@/app/lib/pdf/pdf-service'
import { PDF_CONFIG, PDFGenerationRequest } from '@/app/lib/pdf/pdf-config'
import { Logger } from '@/app/lib/utils/logger'
import { withAuth } from '@/lib/auth-middleware'
import { DecodedIdToken } from 'firebase-admin/auth'

const logger = Logger.getInstance()

const authenticatedPOST = withAuth(async (req: NextRequest, user: DecodedIdToken) => {
  try {
    logger.info(`PDF generation request from user: ${user.uid} (${user.email})`);
    
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
      theme,
      userId: user.uid
    })

    const pdfBuffer = await pdfService.generatePDF(html, options, 'PDF', styles)
    const downloadFilename = filename || 'tiptap-export.pdf'

    logger.info(`PDF generated successfully for user: ${user.uid}, filename: ${downloadFilename}`);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': PDF_CONFIG.CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    logger.error('PDF generation failed:', error, { userId: user.uid })
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
});

export { authenticatedPOST as POST }