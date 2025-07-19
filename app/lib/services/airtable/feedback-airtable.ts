import { AirtableService } from '@/app/lib/services/airtable/airtable-service';
// UserContext removed - public app
import { Logger } from '@/app/lib/utils/logger';

const logger = Logger.getInstance();

export function getFeedbackService(): AirtableService {
    logger.info(`🔧 FEEDBACK SERVICE INITIALIZATION`);
    
    const baseId = process.env.AIRTABLE_BASE_FEEDBACK || '';
    
    logger.info(`📋 Feedback Base ID Present: ${!!baseId}`);
    logger.info(`📋 Feedback Base ID: ${baseId ? baseId : 'MISSING'}`);
    
    if (!baseId) {
        logger.error('❌ AIRTABLE_BASE_FEEDBACK environment variable is not set');
        throw new Error('AIRTABLE_BASE_FEEDBACK environment variable is not set');
    }
    
    logger.info(`✅ Feedback service initialized with base: ${baseId}`);
    return AirtableService.getInstance(baseId);
}

// Enhanced feedback service with user context
export class FeedbackService {
    private airtableService: AirtableService;

    constructor() {
        try {
            logger.info(`🔧 FEEDBACK SERVICE CONSTRUCTOR`);
            this.airtableService = getFeedbackService();
            logger.info(`✅ FeedbackService initialized successfully`);
        } catch (error) {
            logger.error(`❌ Failed to initialize FeedbackService:`, error);
            throw error;
        }
    }

    // Log interaction with full user context
    async logUserInteraction(
        threadId: string,
        runId: string,
        userPrompt: string,
        assistantResponse: string,
        toolCalls?: any,
        toolOutputs?: any,
        rating?: '👍' | '👎' | null,
        comment?: string | null
    ) {
        try {
            logger.info(`📝 LOGGING USER INTERACTION`);
            logger.info(`🔗 Thread ID: ${threadId}`);
            logger.info(`🏃 Run ID: ${runId}`);
            logger.info(`👤 User ID: anonymous`);
            logger.info(`📧 User Email: N/A`);
            logger.info(`💬 User Prompt Length: ${userPrompt.length} chars`);
            logger.info(`🤖 Assistant Response Length: ${assistantResponse.length} chars`);
            
            const result = await this.airtableService.logAssistantInteraction({
                threadId,
                runId,
                userId: undefined,
                userEmail: undefined,
                userDisplayName: undefined,
                userPrompt,
                assistantResponse,
                toolCalls,
                toolOutputs,
                rating,
                comment,
                timestamp: new Date().toISOString(),
                sessionId: `anonymous_${Date.now()}`
            });
            
            logger.info(`✅ User interaction logged successfully`);
            return result;
        } catch (error) {
            logger.error(`❌ Error logging user interaction:`, error);
            throw error;
        }
    }

    // Get user-specific feedback records
    async getUserFeedback(userId: string, limit: number = 50) {
        try {
            logger.info(`🔍 FETCHING USER FEEDBACK`);
            logger.info(`👤 User ID: ${userId}`);
            logger.info(`📊 Limit: ${limit}`);
            
            const records = await this.airtableService.getRecords('Feedbacks');
            logger.info(`📋 Total records fetched: ${records.length}`);
            
            // Filter records by user ID
            const userRecords = records.filter(record => 
                record['User ID'] === userId
            );
            
            logger.info(`👤 User-specific records: ${userRecords.length}`);

            // Sort by timestamp (newest first) and limit
            const sortedRecords = userRecords
                .sort((a, b) => new Date(b.Timestamp || 0).getTime() - new Date(a.Timestamp || 0).getTime())
                .slice(0, limit);
                
            logger.info(`📊 Final records returned: ${sortedRecords.length}`);
            return sortedRecords;
        } catch (error) {
            logger.error(`❌ Error fetching feedback for user ${userId}:`, error);
            throw error;
        }
    }

    // Get interaction by runId with user validation
    async getInteractionByRunId(runId: string, userId?: string) {
        try {
            logger.info(`🔍 FETCHING INTERACTION BY RUN ID`);
            logger.info(`🏃 Run ID: ${runId}`);
            logger.info(`👤 User ID: ${userId || 'N/A'}`);
            
            const records = await this.airtableService.getRecords('Feedbacks');
            const record = records.find(r => r['Run ID'] === runId);
            
            if (!record) {
                logger.warn(`⚠️ No interaction found for runId: ${runId}`);
                return null;
            }

            logger.info(`✅ Found interaction record: ${record.id}`);

            // Validate user access
            if (userId && record['User ID'] && record['User ID'] !== userId) {
                logger.error(`🚫 Access denied for user ${userId} to runId ${runId}`);
                throw new Error('Access denied: You can only view your own interactions');
            }

            return record;
        } catch (error) {
            logger.error(`❌ Error fetching interaction ${runId} for user ${userId}:`, error);
            throw error;
        }
    }

    // Update feedback with user validation
    async updateFeedback(
        runId: string,
        rating: '👍' | '👎',
        comment?: string,
        userId?: string
    ) {
        try {
            logger.info(`📝 UPDATING FEEDBACK`);
            logger.info(`🏃 Run ID: ${runId}`);
            logger.info(`⭐ Rating: ${rating}`);
            logger.info(`💬 Comment: ${comment ? 'Present' : 'None'}`);
            logger.info(`👤 User ID: ${userId || 'N/A'}`);
            
            const existingRecord = await this.getInteractionByRunId(runId, userId);
            
            if (!existingRecord) {
                logger.error(`❌ Interaction not found for runId: ${runId}`);
                throw new Error('Interaction not found');
            }

            // Validate user ownership
            if (userId && existingRecord['User ID'] !== userId) {
                logger.error(`🚫 Access denied for user ${userId} to update runId ${runId}`);
                throw new Error('Access denied: You can only update your own feedback');
            }

            const updateData = {
                'Rating': rating,
                'QA Comment': comment || '',
                'Reviewed By': existingRecord['User Email'] || userId || 'anonymous'
            };

            const result = await this.airtableService.updateRecord(
                'Feedbacks',
                existingRecord.id,
                updateData
            );
            
            logger.info(`✅ Feedback updated successfully for runId: ${runId}`);
            return result;
        } catch (error) {
            logger.error(`❌ Error updating feedback for runId ${runId}, user ${userId}:`, error);
            throw error;
        }
    }

    // Get user statistics
    async getUserStats(userId: string) {
        try {
            logger.info(`📊 FETCHING USER STATS`);
            logger.info(`👤 User ID: ${userId}`);
            
            const userRecords = await this.getUserFeedback(userId);
            
            const stats = {
                totalInteractions: userRecords.length,
                totalFeedback: userRecords.filter(r => r['Rating']).length,
                positiveRatings: userRecords.filter(r => r['Rating'] === '👍').length,
                negativeRatings: userRecords.filter(r => r['Rating'] === '👎').length,
                avgInteractionsPerDay: 0,
                firstInteraction: null as string | null,
                lastInteraction: null as string | null
            };

            if (userRecords.length > 0) {
                const timestamps = userRecords
                    .map(r => new Date(r.Timestamp || 0))
                    .sort((a, b) => a.getTime() - b.getTime());
                
                stats.firstInteraction = timestamps[0].toISOString();
                stats.lastInteraction = timestamps[timestamps.length - 1].toISOString();
                
                // Calculate average interactions per day
                if (timestamps.length > 1) {
                    const daysDiff = (timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()) / (1000 * 60 * 60 * 24);
                    stats.avgInteractionsPerDay = Math.round((userRecords.length / daysDiff) * 100) / 100;
                }
            }

            logger.info(`📊 User stats calculated: ${JSON.stringify(stats)}`);
            return stats;
        } catch (error) {
            logger.error(`❌ Error getting stats for user ${userId}:`, error);
            throw error;
        }
    }
}

// Singleton instance
let feedbackServiceInstance: FeedbackService | null = null;

export function getEnhancedFeedbackService(): FeedbackService {
    if (!feedbackServiceInstance) {
        logger.info(`🔧 Creating new FeedbackService instance`);
        feedbackServiceInstance = new FeedbackService();
    }
    return feedbackServiceInstance;
}
