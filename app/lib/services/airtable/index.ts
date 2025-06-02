import { AirtableService } from './airtable-service';

const DEFAULT_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appG42qzOWosdKmnU';
if (!DEFAULT_BASE_ID) {
    throw new Error('Missing AIRTABLE_BASE_ID in environment variables');
}

export const airtableService = AirtableService.getInstance(DEFAULT_BASE_ID);