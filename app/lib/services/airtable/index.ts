import {AirtableService} from "@/app/lib/services/airtable/airtable-service";
import { Logger } from '@/app/lib/utils/logger';

const logger = Logger.getInstance();

let instance: AirtableService | null = null;

export function getAirtableService(): AirtableService {
    if (!instance) {
        logger.info(`🔧 MAIN AIRTABLE SERVICE INITIALIZATION`);
        
        const baseId = process.env.AIRTABLE_BASE;
        const apiKey = process.env.AIRTABLE_API_KEY;

        logger.info(`📋 Main Base ID Present: ${!!baseId}`);
        logger.info(`🔑 API Key Present: ${!!apiKey}`);
        logger.info(`📋 Main Base ID: ${baseId ? baseId : 'MISSING'}`);
        
        if (apiKey) {
            logger.info(`🔑 API Key Length: ${apiKey.length}`);
            logger.info(`🔑 API Key Format: ${apiKey.startsWith('key') ? 'key*' : apiKey.startsWith('pat') ? 'pat*' : 'unknown'}`);
        }

        if (!apiKey || !baseId) {
            logger.error('❌ Missing AIRTABLE_API_KEY or AIRTABLE_BASE in environment variables');
            logger.error(`❌ AIRTABLE_API_KEY present: ${!!apiKey}`);
            logger.error(`❌ AIRTABLE_BASE present: ${!!baseId}`);
            throw new Error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE in environment variables');
        }

        logger.info(`✅ Creating AirtableService instance for base: ${baseId}`);
        instance = AirtableService.getInstance(baseId);
        logger.info(`✅ Main AirtableService instance created successfully`);
    }
    return instance;
}