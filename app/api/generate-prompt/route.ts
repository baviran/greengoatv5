import { NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/auth-middleware';
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

export const POST = withAuth(async (request: NextRequest, authResult) => {
  const { user, context } = authResult;
  
  // Type guard: user should always be defined when auth is successful
  if (!user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  const logger = Logger.getInstance().withContext({
    ...context,
    component: 'generate-prompt-api',
    action: 'generate-prompt'
  });

  try {
    logger.info('Prompt generation request received');
    
    const { formData, platform, upgrade } = await request.json() as { formData: FormData, platform: Platform, upgrade: boolean };

    logger.info('Processing prompt generation request', undefined, {
      platform,
      upgrade,
      formDataKeys: Object.keys(formData)
    });

    // 1. Fetch User Document from Firestore
    const userDocRef = firestoreAdmin.collection('users').doc(user.uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      logger.warn('User document not found in Firestore');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDocSnap.data()!;
    const promptCount = userData.promptCount || 0;
    const subscriptionStatus = userData.subscription?.status || 'inactive';
    const subscriptionType = userData.subscription?.type || 'free';

    logger.info('User subscription status retrieved', undefined, {
      promptCount,
      subscriptionStatus,
      subscriptionType
    });

    // 2. Check Permissions
    const hasPermission = (subscriptionType === 'premium' && subscriptionStatus === 'active') || promptCount > 0;

    if (!hasPermission) {
      logger.warn('User has no prompts remaining', undefined, {
        promptCount,
        subscriptionStatus,
        subscriptionType
      });
      return NextResponse.json({ error: 'No prompts remaining. Please upgrade.' }, { status: 403 });
    }

    // 3. Decrement Prompt Count for Free Users
    if (subscriptionType === 'free') {
      logger.info('Decrementing prompt count for free user', undefined, {
        currentPromptCount: promptCount
      });
      await userDocRef.update({
        promptCount: admin.firestore.FieldValue.increment(-1),
      });
    }

    // 4. Generate the Prompt
    const { prompt } = generatePrompt(formData, platform, upgrade);

    logger.info('Prompt generated successfully', undefined, {
      platform,
      upgrade,
      promptLength: prompt.length
    });

    // 5. Return the Result
    return NextResponse.json({ prompt });

  } catch (error) {
    logger.error('Error in generate-prompt API route', error);
    if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Authentication token expired, please sign in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});