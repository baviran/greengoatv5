import { NextRequest } from 'next/server';
import { withApiResponse, createApiResponse } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';

// Define types since dashboard page doesn't exist yet
export type FormData = {
  spaceType: string; customSpaceType: string;
  designStyle: string[]; customDesignStyle: string;
  cameraType: string[]; customCameraType: string;
  shootingAngle: string[]; customShootingAngle: string;
  lightingStyle: string[]; customLightingStyle: string;
  colorPalette: string[]; customColorPalette: string;
  materials: string[]; customMaterials: string;
  furniture: string[]; customFurniture: string;
  atmosphere: string[]; customAtmosphere: string;
  seasonTime: string[]; customSeasonTime: string;
  emphasis: string;
};

export type Platform = 'general' | 'promeai' | 'midjourney' | 'chatgpt';

// We'll need to create this file for the prompt generation logic
function generatePrompt(formData: FormData, platform: Platform, upgrade: boolean): { prompt: string } {
  // This is a placeholder - you'll need to implement the actual prompt generation logic
  // based on your existing implementation
  const prompt = `Generated prompt for ${platform} with upgrade: ${upgrade}. Form data: ${JSON.stringify(formData)}`;
  return { prompt };
}

export const POST = withApiResponse('generate-prompt-api', 'generate-prompt')(
  async (request: NextRequest, context) => {
    const logger = Logger.getInstance();

    try {
      logger.info('Prompt generation request received', context);
      
      const { formData, platform, upgrade } = await request.json() as { formData: FormData, platform: Platform, upgrade: boolean };

      logger.info('Processing prompt generation request', context, {
        platform,
        upgrade,
        spaceType: formData.spaceType
      });

      // Validate required fields
      if (!formData || !platform) {
        const errorResponse = ApiResponseBuilder.validationError(
          'Form data and platform are required',
          context,
          !formData ? 'formData' : 'platform'
        );
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      // Generate the prompt based on form data and platform
      const result = generatePrompt(formData, platform, upgrade || false);
      
      logger.info('Prompt generated successfully', context, {
        platform,
        upgrade,
        promptLength: result.prompt.length
      });

      const successResponse = ApiResponseBuilder.success(result, context);
      return createApiResponse(successResponse, HTTP_STATUS.OK);

    } catch (error) {
      logger.error('Prompt generation failed', error, context);

      const errorResponse = ApiResponseBuilder.internalError(
        'Failed to generate prompt',
        context
      );
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
);