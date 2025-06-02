import {Logger} from "@/app/lib/utils/logger";
import {airtableService} from "@/app/lib/services/airtable";

const logger = Logger.getInstance();


export async function getClauseData(clause: string) {
    try {

        logger.info(`Fetching data from table: ${clause}`);
        const records = await airtableService.getRecords(clause);
        if (!records || records.length === 0) {
            return [{ error: 'לא נמצא מידע עבור סעיף זה' }];
        }
        logger.info(`Fetching data from table: ${clause}, records are ${records.length}`);
        return records;

    } catch (err) {
        logger.error(`Error in getClauseData: ${err}`);
        return [{ error: 'שגיאה בשליפת נתונים מהמערכת' }];
    }
}