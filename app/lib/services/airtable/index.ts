import {AirtableService} from "@/app/lib/services/airtable/airtable-service";

let instance: AirtableService | null = null;

export function getAirtableService(): AirtableService {
    if (!instance) {
        const baseId = process.env.AIRTABLE_BASE;
        const apiKey = process.env.AIRTABLE_API_KEY;

        if (!apiKey || !baseId) {
            throw new Error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE in environment variables');
        }

        instance = AirtableService.getInstance(baseId);
    }
    return instance;
}