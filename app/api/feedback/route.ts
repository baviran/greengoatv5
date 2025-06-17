import { NextRequest, NextResponse } from 'next/server';
import { feedbackCache } from '../../lib/services/feedbackCache';
import { getFeedbackService } from '../../lib/services/airtable/feedback-airtable';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { runId, rating, comment } = body;

        console.log(`🔍 Feedback request received for runId: ${runId}, rating: ${rating}`);
        console.log(`📊 Current cache size: ${feedbackCache.size()}`);
        console.log(`🔎 All cached runIds:`, feedbackCache.getAll().map(data => data.runId));

        if (!runId || !rating) {
            return NextResponse.json(
                { error: 'Missing required fields: runId, rating' },
                { status: 400 }
            );
        }

        if (!['like', 'dislike'].includes(rating)) {
            return NextResponse.json(
                { error: 'Rating must be either "like" or "dislike"' },
                { status: 400 }
            );
        }

        // Get the cached interaction data
        console.log(`🔍 Attempting to retrieve cached data for runId: ${runId}`);
        const cachedData = feedbackCache.get(runId);
        
        if (!cachedData) {
            console.error(`❌ Interaction data not found for runId: ${runId}`);
            console.log(`📊 Available runIds in cache:`, feedbackCache.getAll().map(d => d.runId));
            return NextResponse.json(
                { error: 'Interaction data not found for this runId' },
                { status: 404 }
            );
        }

        console.log(`✅ Found cached data for runId: ${runId}`);
        console.log(`📋 Cached data:`, JSON.stringify(cachedData, null, 2));

        // Convert like/dislike to emoji format expected by Airtable
        const airtableRating = rating === 'like' ? '👍' : '👎';

        // Update the cached data with feedback
        const updatedData = feedbackCache.update(runId, {
            rating: airtableRating,
            comment: comment || null
        });

        if (!updatedData) {
            return NextResponse.json(
                { error: 'Failed to update cached data' },
                { status: 500 }
            );
        }

        // Send the complete data to Airtable
        try {
            const airtableResult = await getFeedbackService().logAssistantInteraction(updatedData);
            console.log(`📝 Feedback sent to Airtable for runId: ${runId}, rating: ${airtableRating}`);
            
            return NextResponse.json({ 
                success: true, 
                message: 'Feedback stored successfully',
                runId,
                airtableId: airtableResult.id
            });
        } catch (airtableError) {
            console.error('❌ Error sending to Airtable:', airtableError);
            // Still return success since we have it cached
            return NextResponse.json({ 
                success: true, 
                message: 'Feedback cached successfully, will retry Airtable sync',
                runId,
                warning: 'Airtable sync failed but data is cached'
            });
        }

    } catch (error) {
        console.error('❌ Error processing feedback:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const runId = searchParams.get('runId');

        if (runId) {
            const data = feedbackCache.get(runId);
            if (!data) {
                return NextResponse.json(
                    { error: 'Data not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(data);
        }

        const allData = feedbackCache.getAll();
        return NextResponse.json({ 
            interactions: allData,
            count: allData.length 
        });

    } catch (error) {
        console.error('❌ Error retrieving feedback data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}