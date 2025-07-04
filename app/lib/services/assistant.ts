import {Logger} from "@/app/lib/utils/logger";
import { getAirtableService} from "@/app/lib/services/airtable";

const logger = Logger.getInstance();

export async function getClauseData(clause: string) {
    try {
        logger.info(`🔍 ASSISTANT: GET CLAUSE DATA REQUEST`);
        logger.info(`📋 Clause/Table: ${clause}`);
        logger.info(`⏰ Timestamp: ${new Date().toISOString()}`);
        
        logger.info(`🔧 Initializing Airtable service...`);
        const airtableService = getAirtableService();
        logger.info(`✅ Airtable service initialized successfully`);
        
        logger.info(`🌐 Making API call to Airtable...`);
        const records = await airtableService.getRecords(clause);
        logger.info(`📊 API call completed`);
        
        if (!records || records.length === 0) {
            logger.warn(`⚠️ No records found for clause: ${clause}`);
            return [{ error: 'לא נמצא מידע עבור סעיף זה' }];
        }
        
        logger.info(`✅ Successfully fetched ${records.length} records from table: ${clause}`);
        logger.info(`📊 First record sample: ${JSON.stringify(records[0], null, 2)}`);
        
        return records;
    } catch (err) {
        logger.error(`❌ ERROR in getClauseData for clause: ${clause}`, {
            error: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined,
            clause: clause,
            timestamp: new Date().toISOString()
        });
        
        return [{ error: 'שגיאה בשליפת נתונים מהמערכת' }];
    }
}