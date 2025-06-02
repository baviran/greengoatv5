import type OpenAI from 'openai';

export type AssistantRun = OpenAI.Beta.Threads.Runs.Run;
export type RunStatus = OpenAI.Beta.Threads.Runs.Run['status'];
export type RunRequiredAction = OpenAI.Beta.Threads.Runs.Run['required_action'];
export type RunRequiredActionSubmitToolOutputs = Extract<RunRequiredAction, { type: 'submit_tool_outputs' }>;
export type RunFunctionToolCall = OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall;
export type RunToolOutput = OpenAI.Beta.Threads.Runs.RunSubmitToolOutputParams.ToolOutput;

export type AssistantThread = OpenAI.Beta.Threads.Thread;

export type AssistantMessage = OpenAI.Beta.Threads.Message;
export type AssistantMessageContent = OpenAI.Beta.Threads.Message['content'][number];
export type AssistantMessageContentText = Extract<AssistantMessageContent, { type: 'text' }>;

export const ACTIVE_RUN_STATUSES: ReadonlyArray<RunStatus> = [
    'queued',
    'in_progress',
    'requires_action',
];

export const FAILED_TERMINAL_RUN_STATUSES: ReadonlyArray<RunStatus> = [
    'failed',
    'cancelled',
    'expired',
];

export function isActiveRunStatus(status: RunStatus): boolean {
    return ACTIVE_RUN_STATUSES.includes(status);
}

export function isFailedTerminalRunStatus(status: RunStatus): boolean {
    return FAILED_TERMINAL_RUN_STATUSES.includes(status);
}

export function isSubmitToolOutputsAction(
    action: RunRequiredAction | null | undefined
): action is RunRequiredActionSubmitToolOutputs {
    return action?.type === 'submit_tool_outputs';
}

export function isTextContent(
    contentBlock: AssistantMessageContent
): contentBlock is AssistantMessageContentText {
    return contentBlock.type === 'text';
}
