import Airtable, { Base } from 'airtable';
import { Logger } from '@/app/lib/utils/logger';
import axios from "axios";
import https from 'https';
import {AirtableSchema} from "@/app/types/airtable";

const logger = Logger.getInstance();

// Create HTTPS agent to handle SSL certificate issues
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

export class AirtableService {
    private static instances: Record<string, AirtableService> = {};

    private base: Base;
    private readonly apiKey: string;
    private readonly baseId: string;

    constructor(baseId: string) {
        this.baseId = baseId;
        this.apiKey = process.env.AIRTABLE_API_KEY || '';
        
        if (!this.apiKey) {
            logger.error('AIRTABLE_API_KEY environment variable is not set');
            throw new Error('AIRTABLE_API_KEY environment variable is not set');
        }
        
        Airtable.configure({ apiKey: this.apiKey });
        this.base = Airtable.base(baseId);
        logger.info(`AirtableService initialized for base: ${baseId}`);
    }

    static getInstance(baseId: string): AirtableService {
        if (!AirtableService.instances[baseId]) {
            AirtableService.instances[baseId] = new AirtableService(baseId);
        }
        return AirtableService.instances[baseId];
    }

    async getRecords(clause: string): Promise<any[]> {
        try {
            logger.info(`Airtable API key present: ${!!this.apiKey}`);
            logger.info(`Using Airtable baseId: ${this.baseId}`);
            const url = `https://api.airtable.com/v0/${this.baseId}/${clause}`;
            logger.info(`Getting records for request URL: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                httpsAgent: httpsAgent
            });
            logger.info(`***This is how the response looks like : `);
            return response.data.records.map((record: { id: string; fields: any }) => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error: any) {
            logger.error(`Error fetching records from table: ${clause}`, {
                message: error?.message,
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                responseData: error?.response?.data,
            });
            throw error;
        }
    }

    async getRecord(tableName: string, recordId: string) {
        try {
            logger.info(`Fetching record ${recordId} from ${tableName}`);
            const record = await this.base(tableName).find(recordId);
            return {
                id: record.id,
                ...record.fields
            };
        } catch (error) {
            logger.error(`Error fetching record ${recordId} from ${tableName}:`, error);
            throw error;
        }
    }

    async createRecord(tableId: string, fields: Record<string, any>): Promise<any> {
        const url = `https://api.airtable.com/v0/${this.baseId}/${tableId}`;
        try {
            logger.info(`Creating record in base: ${this.baseId}, table: ${tableId}`);
            logger.info(`Request URL: ${url}`);
            logger.info(`Payload: ${JSON.stringify({ fields }, null, 2)}`);

            const response = await axios.post(
                url,
                { fields },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    httpsAgent: httpsAgent
                }
            );

            return {
                id: response.data.id,
                ...response.data.fields
            };
        } catch (error: any) {
            logger.error('Error creating record in Airtable:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                requestPayload: { fields }
            });
            throw error;
        }
    }

    async updateRecord(tableName: string, recordId: string, fields: any) {
        const url = `https://api.airtable.com/v0/${this.baseId}/${tableName}/${recordId}`;
        try {
            logger.info(`Updating record ${recordId} in ${tableName}`);
            logger.info(`Request URL: ${url}`);
            logger.info(`Update payload: ${JSON.stringify({ fields }, null, 2)}`);

            const response = await axios.patch(
                url,
                { fields },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    httpsAgent: httpsAgent
                }
            );

            return {
                id: response.data.id,
                ...response.data.fields
            };
        } catch (error: any) {
            logger.error('Error updating record in Airtable:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                requestPayload: { fields }
            });
            throw error;
        }
    }

    async deleteRecord(tableName: string, recordId: string) {
        try {
            logger.info(`Deleting record ${recordId} from ${tableName}`);
            await this.base(tableName).destroy(recordId);
            return recordId;
        } catch (error) {
            logger.error(`Error deleting record ${recordId} from ${tableName}:`, error);
            throw error;
        }
    }

    async createRecords(tableName: string, records: any[]) {
        try {
            logger.info(`Creating ${records.length} records in ${tableName}`);
            const createdRecords = await this.base(tableName).create(records);
            return createdRecords.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            logger.error(`Error creating records in ${tableName}:`, error);
            throw error;
        }
    }

    async updateRecords(tableName: string, records: Array<{id: string, fields: any}>) {
        try {
            logger.info(`Updating ${records.length} records in ${tableName}`);
            const updatedRecords = await this.base(tableName).update(
                records.map(r => ({ id: r.id, fields: r.fields }))
            );
            return updatedRecords.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            logger.error(`Error updating records in ${tableName}:`, error);
            throw error;
        }
    }

    async getSchema(): Promise<AirtableSchema> {
        const baseId = this.baseId;
        const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                httpsAgent: httpsAgent
            });

            return response.data;
        } catch (error) {
            logger.error(
                error instanceof Error ? error.message : String(error),
                'Error fetching schema:'
            );
            throw error;
        }
    }

    async updateTableNames() {
        const tables = (await this.getSchema()).tables;

        for (const table of tables) {
            const currentName = table.name;
            logger.info('Current table name: ' + currentName);
            const match = currentName.match(/\d+(\.\d+)*/);
            const newName = match ? match[0] : '';
            logger.info('Matched name: ' + newName);
            try {
                await this.renameTableName(table.id, newName);
                logger.info(`Renamed table ${table.id} to '${newName}'`);
            } catch (err: any) {
                logger.error(`Error renaming table ${table.id}:`, err.response?.data || err.message);
            }
        }
    }

    async getTableIds(): Promise<string[]>{
        const schema=  await this.getSchema();
        return schema.tables.map(({id})=>id);
    }

    async getTableName(tableId: string): Promise<{ id: string; name: string }> {
        try {
            const response = await axios.get(
                `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${tableId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    httpsAgent: httpsAgent
                }
            );
            return response.data;
        }
        catch (error) {
            logger.error(`Error getTableName:`, error);
            throw error;
        }
    }

    async renameTableName(tableId: string, name: string): Promise<{ id: string; name: string }> {
        try {
            const response = await axios.patch(
                `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${tableId}`,
                { name },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    httpsAgent: httpsAgent
                }
            );
            return response.data;
        }
        catch (error) {
            logger.error(`Error renameTableName:`, error);
            throw error;
        }
    }

    async updateColumnName(tableId: string, oldName: string, newName: string): Promise<void> {
        try {
            const tables = (await this.getSchema()).tables;
            const table = tables.find(t => t.id === tableId);

            if (!table) {
                throw new Error(`Table with ID ${tableId} not found`);
            }

            logger.info(`Looking for field with exact name: '${oldName}'`);
            logger.info('Available field names:');
            table.fields.forEach(f => logger.info(`'${f.name}'`));
            const field =
                table.fields.find(f => f.name === oldName) ??
                table.fields.find(f => f.name.toLowerCase() === oldName.toLowerCase());
            if (!field) {
                logger.info(`Field name not found using strict match. Trying locale-insensitive match.`);
                const fuzzy = table.fields.find(f => f.name.toLowerCase() === oldName.toLowerCase());
                if (!fuzzy) {
                    throw new Error(`Field '${oldName}' not found in table '${table.name}'`);
                }
                logger.info(`Found field using normalized match: '${fuzzy.name}'`);
            }

            logger.info(`Renaming field '${oldName}' to '${newName}' in table '${table.name}'`);
            logger.info(`Inspecting newName: "${newName}"`);
            let charCodes = '';
            for (let i = 0; i < newName.length; i++) {
                charCodes += `${newName.charCodeAt(i)} `;
            }
            logger.info(`Char codes for newName: ${charCodes.trim()}`);
            const payload = { name: newName };
            logger.info(`PATCHing field '${field?.id}' in table '${tableId}' with name '${newName}'`);
            await axios.patch(
                `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${tableId}/fields/${field?.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    httpsAgent
                }
            );

            logger.info(`Field renamed successfully from '${oldName}' to '${newName}'`);
        } catch (error: any) {
            logger.error(
                `Error renaming column from '${oldName}' to '${newName}' in table '${tableId}':`,
                error.response?.data || error.message
            );
            throw error;
        }
    }

    async updateAllBaseTableColumnNames(){
        const tableIds = await this.getTableIds();
        for (const tableId of tableIds){
            await this.updateTableColumnNames(tableId);
        }
    }

    async updateTableColumnNames(tableId: string) {
        const renameMap: Record<string, string> = {
            'שם סעיף': 'שם סעיף - clause name',
            'תת סעיף': 'תת סעיף - sub clause',
            'ניקוד': 'ניקוד - score',
            'מאפיין': 'מאפיין - attribute',
            'מטרה': 'מטרה - goal',
            'קריטריונים להערכת הסעיף': 'קריטריונים להערכת סעיף - evaluation criteria',
            'מדריך להכנת הסעיף': 'מדריך להכנת הסעיף - clause preparation guide',
            'הערות מהתקן': 'הערות מהתקן - standard notes',
            'להגשה בשלב מקדמי': 'להגשה בשלב המקדמי - required for preliminary phase',
            'להגשה בשלב ב': 'להגשה בשלב ב - required for phase B',
            'להגשה בשלב א': 'להגשה בשלב א - required for phase A',
            'הצהרה לשלב מקדמי': 'הצהרה לשלב המקדמי - preliminary phase declaration',
            'יועץ אחראי': 'יועץ אחראי - responsible consultant'
        };
        
        for (const [oldName, newName] of Object.entries(renameMap)) {
            try {
                await this.updateColumnName(tableId, oldName, newName);
                logger.info(`Successfully renamed column '${oldName}' to '${newName}' in table '${tableId}'`);
            } catch (err) {
                logger.error(`Failed to rename '${oldName}' to '${newName}' in table '${tableId}'`, err);
            }
        }
    }
    async logAssistantInteraction(fields: {
        threadId: string;
        runId: string;
        userPrompt: string;
        assistantResponse: string;
        toolCalls?: any;
        toolOutputs?: any;
        reviewer?: string | null;
        rating?: '👍' | '👎' | null;
        comment?: string | null;
    }): Promise<any> {
        try {
            const tableId = 'Feedbacks';

            // Check if a record with this runId already exists
            const existingRecord = await this.findRecordByRunId(tableId, fields.runId);

            const recordData = {
                'Thread ID': fields.threadId,
                'Run ID': fields.runId,
                'User Prompt': fields.userPrompt,
                'Assistant Response': fields.assistantResponse,
                'Tool Calls': fields.toolCalls ? JSON.stringify(fields.toolCalls) : '',
                'Tool Outputs': fields.toolOutputs ? JSON.stringify(fields.toolOutputs) : '',
                'Rating': fields.rating ?? '',
                'QA Comment': fields.comment ?? '',
                'Reviewed By': fields.reviewer ?? ''
            };

            let record;
            if (existingRecord) {
                // Update existing record
                logger.info(`Updating existing record for runId: ${fields.runId}, recordId: ${existingRecord.id}`);
                record = await this.updateRecord(tableId, existingRecord.id, recordData);
                logger.info(`Updated interaction record: ${record.id}`);
            } else {
                // Create new record
                logger.info(`Creating new record for runId: ${fields.runId}`);
                record = await this.createRecord(tableId, recordData);
                logger.info(`Created new interaction record: ${record.id}`);
            }

            return record;
        } catch (error) {
            logger.error('Failed to log assistant interaction:', error);
            throw error;
        }
    }

    private async findRecordByRunId(tableId: string, runId: string): Promise<any | null> {
        try {
            const url = `https://api.airtable.com/v0/${this.baseId}/${tableId}`;
            const filterFormula = `{Run ID} = '${runId}'`;
            
            logger.info(`Searching for existing record with runId: ${runId}`);
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                params: {
                    filterByFormula: filterFormula,
                    maxRecords: 1
                },
                httpsAgent: httpsAgent
            });

            const records = response.data.records;
            if (records && records.length > 0) {
                logger.info(`Found existing record for runId: ${runId}, recordId: ${records[0].id}`);
                return {
                    id: records[0].id,
                    ...records[0].fields
                };
            }

            logger.info(`No existing record found for runId: ${runId}`);
            return null;
        } catch (error: any) {
            logger.error(`Error searching for record with runId ${runId}:`, {
                message: error.message,
                status: error.response?.status,
                responseData: error.response?.data
            });
            // Don't throw the error here - if we can't search, we'll just create a new record
            return null;
        }
    }
}