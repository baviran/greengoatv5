import { NextRequest } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';
import { withApiResponse, createApiResponse, AuthResultWithContext } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';
import admin from 'firebase-admin';

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
  async (request: NextRequest, authResult: AuthResultWithContext) => {
    const { user, context } = authResult;
    const logger = Logger.getInstance();
    
    // Type guard: user should always be defined when auth is successful
    if (!user) {
      const errorResponse = ApiResponseBuilder.unauthorized('Authentication failed', context);
      return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }

    try {
      logger.info('Prompt generation request received', context);
      
      const { formData, platform, upgrade } = await request.json() as { formData: FormData, platform: Platform, upgrade: boolean };

      logger.info('Processing prompt generation request', context, {
        platform,
        upgrade,
        formDataKeys: Object.keys(formData)
      });

      // 1. Fetch User Document from Firestore
      const userDocRef = firestoreAdmin.collection('users').doc(user.uid);
      const userDocSnap = await userDocRef.get();

      if (!userDocSnap.exists) {
        logger.warn('User document not found in Firestore', context);
        const errorResponse = ApiResponseBuilder.notFound('User not found', context);
        return createApiResponse(errorResponse, HTTP_STATUS.NOT_FOUND);
      }

      const userData = userDocSnap.data()!;
      const promptCount = userData.promptCount || 0;
      const subscriptionStatus = userData.subscription?.status || 'inactive';
      const subscriptionType = userData.subscription?.type || 'free';

      logger.info('User subscription status retrieved', context, {
        promptCount,
        subscriptionStatus,
        subscriptionType
      });

      // 2. Check Permissions
      const hasPermission = (subscriptionType === 'premium' && subscriptionStatus === 'active') || promptCount > 0;

      if (!hasPermission) {
        logger.warn('User has no prompts remaining', context, {
          promptCount,
          subscriptionStatus,
          subscriptionType
        });
        const errorResponse = ApiResponseBuilder.forbidden('No prompts remaining. Please upgrade.', context);
        return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
      }

      // 3. Decrement Prompt Count for Free Users
      if (subscriptionType === 'free') {
        logger.info('Decrementing prompt count for free user', context, {
          currentPromptCount: promptCount
        });
        await userDocRef.update({
          promptCount: admin.firestore.FieldValue.increment(-1),
        });
      }

      // 4. Generate the Prompt
      const { prompt } = generatePrompt(formData, platform, upgrade);

      logger.info('Prompt generated successfully', context, {
        platform,
        upgrade,
        promptLength: prompt.length
      });

      // 5. Return the Result
      const responseData = { prompt };
      const successResponse = ApiResponseBuilder.success(responseData, context);
      return createApiResponse(successResponse, HTTP_STATUS.OK);

    } catch (error) {
      logger.error('Error in generate-prompt API route', error, context);
      if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
        const errorResponse = ApiResponseBuilder.unauthorized('Authentication token expired, please sign in again.', context);
        return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
      }
      const errorResponse = ApiResponseBuilder.internalError('Internal Server Error', context);
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
);