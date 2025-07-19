import Airtable, { Base } from 'airtable';
import { Logger } from '@/app/lib/utils/logger';
import axios from "axios";
import https from 'https';
import {AirtableSchema} from "@/app/types/airtable";
import { AirtableError } from '@/app/lib/errors/app-errors';

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
        
        // Enhanced logging for debugging
        logger.info(`🔧 AIRTABLE SERVICE INITIALIZATION`);
        logger.info(`📋 Base ID: ${baseId ? baseId : 'MISSING'}`);
        logger.info(`🔑 API Key Present: ${!!this.apiKey}`);
        logger.info(`🔑 API Key Length: ${this.apiKey.length}`);
        logger.info(`🔑 API Key Starts With: ${this.apiKey.substring(0, 10)}...`);
        
        if (!this.apiKey) {
            logger.error('❌ AIRTABLE_API_KEY environment variable is not set');
            throw new AirtableError('AIRTABLE_API_KEY environment variable is not set');
        }
        
        if (!baseId) {
            logger.error('❌ Airtable Base ID is not provided');
            throw new AirtableError('Airtable Base ID is not provided');
        }
        
        // Validate API key format (Airtable keys start with 'key' or 'pat')
        if (!this.apiKey.startsWith('key') && !this.apiKey.startsWith('pat')) {
            logger.warn('⚠️ Airtable API key format might be invalid - should start with "key" or "pat"');
        }
        
        try {
            Airtable.configure({ apiKey: this.apiKey });
            this.base = Airtable.base(baseId);
            logger.info(`✅ AirtableService initialized successfully for base: ${baseId}`);
        } catch (error) {
            logger.error(`❌ Failed to initialize AirtableService:`, error);
            throw new AirtableError(`Failed to initialize AirtableService: ${error}`);
        }
    }

    static getInstance(baseId: string): AirtableService {
        if (!AirtableService.instances[baseId]) {
            AirtableService.instances[baseId] = new AirtableService(baseId);
        }
        return AirtableService.instances[baseId];
    }

    async getRecords(clause: string): Promise<any[]> {
        try {
            logger.info(`🔍 AIRTABLE GET RECORDS REQUEST`);
            logger.info(`📋 Base ID: ${this.baseId}`);
            logger.info(`📄 Table/Clause: ${clause}`);
            logger.info(`🔑 API Key Present: ${!!this.apiKey}`);
            logger.info(`🔑 API Key First 10 chars: ${this.apiKey.substring(0, 10)}...`);
            
            const url = `https://api.airtable.com/v0/${this.baseId}/${clause}`;
            logger.info(`🌐 Request URL: ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'User-Agent': 'GreenGoat-v5/1.0'
                },
                httpsAgent: httpsAgent,
                timeout: 10000 // 10 second timeout
            });
            
            logger.info(`✅ Airtable API Response Status: ${response.status}`);
            logger.info(`📊 Records Count: ${response.data.records?.length || 0}`);
            logger.info(`📋 Response Headers: ${JSON.stringify(response.headers)}`);
            
            return response.data.records.map((record: { id: string; fields: any }) => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error: any) {
            logger.error(`❌ AIRTABLE API ERROR - Table: ${clause}`, {
                message: error?.message,
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                responseData: error?.response?.data,
                requestConfig: {
                    url: error?.config?.url,
                    method: error?.config?.method,
                    headers: error?.config?.headers ? 'Present' : 'Missing'
                },
                isNetworkError: error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT',
                isAuthError: error?.response?.status === 401 || error?.response?.status === 403,
                isNotFoundError: error?.response?.status === 404,
                isRateLimitError: error?.response?.status === 429,
                errorCode: error?.code
            });
            
            // Enhanced error handling
            if (error?.response?.status === 401) {
                logger.error('🔐 Authentication Failed - Check API Key');
            } else if (error?.response?.status === 403) {
                logger.error('🚫 Access Forbidden - Check API Key Permissions');
            } else if (error?.response?.status === 404) {
                logger.error('🔍 Resource Not Found - Check Base ID and Table Name');
            } else if (error?.response?.status === 429) {
                logger.error('⏰ Rate Limited - Too Many Requests');
            }
            
            throw new AirtableError(`Airtable API error: ${error.message || error}`);
        }
    }

    async getRecord(tableName: string, recordId: string) {
        try {
            logger.info(`🔍 Fetching single record ${recordId} from ${tableName}`);
            const record = await this.base(tableName).find(recordId);
            logger.info(`✅ Successfully fetched record ${recordId}`);
            return {
                id: record.id,
                ...record.fields
            };
        } catch (error) {
            logger.error(`❌ Error fetching record ${recordId} from ${tableName}:`, error);
            throw new AirtableError(`Error fetching record ${recordId} from ${tableName}: ${error}`);
        }
    }

    async createRecord(tableId: string, fields: Record<string, any>): Promise<any> {
        const url = `https://api.airtable.com/v0/${this.baseId}/${tableId}`;
        try {
            logger.info(`📝 AIRTABLE CREATE RECORD REQUEST`);
            logger.info(`📋 Base: ${this.baseId}, Table: ${tableId}`);
            logger.info(`🌐 Request URL: ${url}`);
            logger.info(`📊 Payload: ${JSON.stringify({ fields }, null, 2)}`);

            const response = await axios.post(
                url,
                { fields },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'GreenGoat-v5/1.0'
                    },
                    httpsAgent: httpsAgent,
                    timeout: 10000
                }
            );

            logger.info(`✅ Record created successfully - ID: ${response.data.id}`);
            return {
                id: response.data.id,
                ...response.data.fields
            };
        } catch (error: any) {
            logger.error('❌ AIRTABLE CREATE RECORD ERROR:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                requestPayload: { fields },
                url: url,
                baseId: this.baseId,
                tableId: tableId
            });
            throw new AirtableError(`Error creating record: ${error.message || error}`);
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
            throw new AirtableError(`Error updating record: ${error.message || error}`);
        }
    }

    async deleteRecord(tableName: string, recordId: string) {
        try {
            logger.info(`Deleting record ${recordId} from ${tableName}`);
            await this.base(tableName).destroy(recordId);
            return recordId;
        } catch (error) {
            logger.error(`Error deleting record ${recordId} from ${tableName}:`, error);
            throw new AirtableError(`Error deleting record ${recordId} from ${tableName}: ${error}`);
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
            throw new AirtableError(`Error creating records in ${tableName}: ${error}`);
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
            throw new AirtableError(`Error updating records in ${tableName}: ${error}`);
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
            throw new AirtableError(`Error fetching schema: ${error}`);
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
            throw new AirtableError(`Error getting table name: ${error}`);
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
            throw new AirtableError(`Error renaming table name: ${error}`);
        }
    }

    async updateColumnName(tableId: string, oldName: string, newName: string): Promise<void> {
        try {
            const tables = (await this.getSchema()).tables;
            const table = tables.find(t => t.id === tableId);

            if (!table) {
                throw new AirtableError(`Table with ID ${tableId} not found`);
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
                    throw new AirtableError(`Field '${oldName}' not found in table '${table.name}'`);
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
            throw new AirtableError(`Error renaming column from '${oldName}' to '${newName}' in table '${tableId}': ${error.message || error}`);
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
        userId?: string;
        userEmail?: string;
        userDisplayName?: string;
        userPrompt: string;
        assistantResponse: string;
        toolCalls?: any;
        toolOutputs?: any;
        reviewer?: string | null;
        rating?: '👍' | '👎' | null;
        comment?: string | null;
        timestamp?: string;
        sessionId?: string;
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
                'QA Comment': fields.comment ?? '',
                'Reviewed By': fields.reviewer ?? '',
                'Rating': fields.rating ?? ''
            };

            let record;
            if (existingRecord) {
                // Update existing record
                logger.info(`Updating existing record for runId: ${fields.runId}, recordId: ${existingRecord.id}, user: ${fields.userId || 'anonymous'}`);
                record = await this.updateRecord(tableId, existingRecord.id, recordData);
                logger.info(`Updated interaction record: ${record.id} for user: ${fields.userId || 'anonymous'}`);
            } else {
                // Create new record
                logger.info(`Creating new record for runId: ${fields.runId}, user: ${fields.userId || 'anonymous'}`);
                record = await this.createRecord(tableId, recordData);
                logger.info(`Created new interaction record: ${record.id} for user: ${fields.userId || 'anonymous'}`);
            }

            return record;
        } catch (error) {
            logger.error(`Failed to log assistant interaction for user: ${fields.userId || 'anonymous'}`, error);
            throw new AirtableError(`Failed to log assistant interaction for user: ${fields.userId || 'anonymous'}: ${error}`);
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