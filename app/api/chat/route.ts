import { NextRequest, NextResponse } from 'next/server';
import { getClauseData } from '@/app/lib/services/assistant';
import { Logger } from '@/app/lib/utils/logger';

import {
    AssistantRun,
    RunFunctionToolCall,
    RunToolOutput,
    isActiveRunStatus,
    isFailedTerminalRunStatus,
    isSubmitToolOutputsAction,
    isTextContent
} from '@/app/types/openai';
import {OpenAIService} from "@/app/lib/services/openai";

let openai: OpenAIService;

const logger = Logger.getInstance();



async function getOrCreateThread(existingThreadId?: string): Promise<string> {
    if (existingThreadId && existingThreadId !== 'undefined' && existingThreadId.trim() !== '') {
        logger.info(`Using existing thread ID: ${existingThreadId}`);
        return existingThreadId;
    }
    logger.info(`Creating new thread (received threadId: ${existingThreadId})`);
    const thread =await openai.createThread();

    logger.info(`Created new thread with ID: ${thread.id}`);
    return thread.id;
}

async function executeToolCall(
    toolCall: RunFunctionToolCall
): Promise<RunToolOutput> {
    const functionName = toolCall.function.name;
    let functionArgs: any;
    try {
        functionArgs = JSON.parse(toolCall.function.arguments);
    } catch (error) {
        logger.error(`Failed to parse function arguments for ${functionName}: ${toolCall.function.arguments}`, error);
        return {
            tool_call_id: toolCall.id,
            output: JSON.stringify({ error: "Invalid arguments format for function call." }),
        };
    }

    logger.info(`Tool call: ${functionName}, Args: ${JSON.stringify(functionArgs)}`);
    let output: any;

    if (functionName === 'get_clause_table') {
        const clause = (functionArgs.clause as string);
        if (clause) {
            output = await getClauseData(clause);
        } else {
            logger.error(`Missing 'clause' argument for get_clause_table`);
            output = { error: "Missing 'clause' argument for get_clause_table" };
        }
    } else {
        logger.warn(`Unknown function call: ${functionName}`);
        output = { error: `Unknown function ${functionName}` };
    }

    return {
        tool_call_id: toolCall.id,
        output: JSON.stringify(output),
    };
}

async function handleRequiredActions(
    threadId: string,
    run: AssistantRun
): Promise<void> {
    if (!isSubmitToolOutputsAction(run.required_action)) {
        if (run.required_action) {
            logger.warn(`Run ${run.id} requires an unhandled action type`);
        }
        return;
    }

    logger.info(`Run ${run.id} requires action: submit_tool_outputs.`);
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

    const toolOutputs = await Promise.all(
        toolCalls.map(tc => executeToolCall(tc as RunFunctionToolCall))
    );

    if (toolOutputs.length > 0) {
        await openai.submitToolOutputs(threadId,run.id,toolOutputs);
        logger.info(`Submitted ${toolOutputs.length} tool output(s) for run ${run.id}`);
    } else {
        logger.warn(`No tool outputs generated for run ${run.id} despite requires_action (submit_tool_outputs).`);
    }
}

async function getAssistantFinalResponse(threadId: string, runId: string): Promise<string | null> {
    const messages = await openai.listMessages(threadId);
    const lastUserMessageIndex = messages.data.map(m => m.role).lastIndexOf('user');
    const assistantMessages = messages.data
        .slice(lastUserMessageIndex + 1)
        .filter(m => m.role === 'assistant' && m.run_id === runId);

    if (assistantMessages.length === 0) {
        logger.warn(`No assistant messages found for run ${runId} in thread ${threadId}`);
        return null;
    }

    return assistantMessages
        .flatMap(m => m.content)
        .filter(isTextContent)
        .map(c => c.text.value)
        .join('\n');
}

async function processRun(
    threadId: string,
    runId: string
): Promise<string | null> {
    let run = await openai.retrieveRun(threadId,runId);
    let attempt = 0;
    const maxAttempts = 20;

    while (isActiveRunStatus(run.status) && attempt < maxAttempts) {
        attempt++;
        logger.info(`Run ${run.id} status: ${run.status} (Attempt: ${attempt})`);

        if (run.status === 'requires_action') {
            await handleRequiredActions(threadId, run);
        }

        if (run.status !== 'requires_action') {
            await new Promise(resolve => setTimeout(resolve, 1000 + (attempt * 100)));
        }
        run = await openai.retrieveRun(threadId,runId);
    }

    if (attempt >= maxAttempts && isActiveRunStatus(run.status)) {
        logger.error(`Run ${run.id} timed out after ${maxAttempts} attempts with status ${run.status}.`);
        throw new Error(`Run timed out with status: ${run.status}`);
    }

    if (run.status === 'completed') {
        logger.info(`Run ${run.id} completed.`);
        const response = await getAssistantFinalResponse(threadId, run.id);
        logger.info(`Assistant response: ${response ? response.substring(0,100) + '...' : 'null' }`);
        return response;
    } else if (isFailedTerminalRunStatus(run.status)) {
        logger.error(`Run ${run.id} ended with status: ${run.status}. Last error: ${JSON.stringify(run.last_error)}`);
        throw new Error(`Run ${run.status}. Details: ${JSON.stringify(run.last_error?.message || run.last_error)}`);
    }

    logger.warn(`Run ${run.id} ended in an unexpected state: ${run.status}`);
    return null;
}

export async function POST(req: NextRequest) {
    logger.info(`Processing chat request with payload: ${JSON.stringify(req.body)}`);
    try {
        openai = OpenAIService.getInstance();
        const body = await req.json();
        const { message, threadId: existingThreadId, assistantId } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        if (!assistantId) {
            return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
        }

        logger.info(`Received message: "${message}", Thread ID: ${existingThreadId}, Assistant ID: ${assistantId}`);

        const threadId = await getOrCreateThread(existingThreadId);
        await openai.sendMessageToThread(threadId,message);
        logger.info(`Added message to thread ${threadId}`);
        const initialRun = await openai.runAssistantOnThread(threadId,assistantId);
        logger.info(`Created initial run ${initialRun.id} for thread ${threadId}`);

        const assistantResponse = await processRun(threadId, initialRun.id);

        logger.info(`Successfully processed chat request with response: ${JSON.stringify(assistantResponse)}`);
        return NextResponse.json({ response: assistantResponse, threadId }, { status: 200 });

    } catch (error: any) {
        logger.error(`Error processing chat request`, error);
        const errorMessage = error.message || 'Internal Server Error';
        const errorDetails = error.details || (error instanceof Error ? error.stack : undefined);
        logger.error(`Error in API route: ${errorMessage}`, errorDetails ? { details: errorDetails } : error);

        if (error.status && error.message && typeof error.status === 'number') {
            return NextResponse.json({ error: error.message, details: error.error?.message || error.details }, { status: error.status });
        }

        return NextResponse.json({ error: 'Internal Server Error Processing Assistant Request', details: errorMessage }, { status: 500 });
    }
}
