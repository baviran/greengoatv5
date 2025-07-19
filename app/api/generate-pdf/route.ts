import { NextRequest, NextResponse } from 'next/server'
import { pdfService } from '@/app/lib/pdf/pdf-service'
import { PDF_CONFIG, PDFGenerationRequest } from '@/app/lib/pdf/pdf-config'
import { Logger } from '@/app/lib/utils/logger'
import { withApiResponse, createApiResponse } from '@/app/lib/utils/response-middleware'
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response'

const logger = Logger.getInstance()

const publicPOST = withApiResponse('generate-pdf-api', 'generate-pdf')(
  async (req: NextRequest, context) => {
    try {
      logger.info('PDF generation request received', context);
      
      const body: PDFGenerationRequest = await req.json()
      const { html, options, filename, styles, theme } = body

      if (!html) {
        const errorResponse = ApiResponseBuilder.validationError('HTML content is required', context, 'html');
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      logger.info('Generating PDF from HTML content', context, { 
        hasCustomStyles: !!styles,
        theme
      })

      const pdfBuffer = await pdfService.generatePDF(html, options, 'PDF', styles)
      const downloadFilename = filename || 'tiptap-export.pdf'

      logger.info(`PDF generated successfully, filename: ${downloadFilename}`, context);

      // For binary file responses, we return the buffer directly (not using unified response format)
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': PDF_CONFIG.CONTENT_TYPE,
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })

    } catch (error) {
      logger.error('PDF generation failed', error, context)
      
      const errorResponse = ApiResponseBuilder.internalError('Failed to generate PDF', context)
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
  }
)

export { publicPOST as POST }