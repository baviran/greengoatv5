import { AirtableService } from '@/app/lib/services/airtable/airtable-service';

export function getFeedbackService(): AirtableService {
    const baseId = process.env.AIRTABLE_BASE_FEEDBACK || '';
    return AirtableService.getInstance(baseId);
}
