import { ReactNode } from 'react';



import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

import { Card } from '@/components/ui/card';

import { actionTools } from './generic/action';
import { jinaTools } from './generic/jina';
import { telegramTools } from './generic/telegram';
import { utilTools } from './generic/util';
import { bitcoinTools } from './bitcoin/bitcoin';
import { magicEdenTools } from './bitcoin/magic-eden';
import { mempoolTools } from './bitcoin/mempool';

const usingAnthropic = !!process.env.ANTHROPIC_API_KEY;

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const claude35Sonnet = anthropic('claude-3-5-sonnet-20241022');

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
  ...(process.env.OPENAI_BASE_URL?.includes('openrouter.ai') && {
    fetch: async (url, options) => {
      if (!options?.body) return fetch(url, options);

      const body = JSON.parse(options.body as string);

      const modifiedBody = {
        ...body,
        provider: {
          order: ['Anthropic', 'OpenAI'],
          allow_fallbacks: false,
        },
      };

      options.body = JSON.stringify(modifiedBody);

      return fetch(url, options);
    },
  }),
});

export const orchestratorModel = openai('gpt-4o-mini');

const openAiModel = openai(process.env.OPENAI_MODEL_NAME || 'gpt-4o');

export const defaultSystemPrompt = `
Your name is Bitx (Agent).
You are a specialized AI assistant for Bitcoin blockchain and DeFi operations, designed to provide secure, accurate, and user-friendly assistance.
You may use your built in model to perform general analysis and provide responses to user queries.
If you need to perform specific tasks you don't have built in training for, you can use the available tools.

Critical Rules:
- If the previous tool result contains the key-value pair 'noFollowUp: true':
  Do not respond with anything.
- If the previous tool result contains the key-value pair 'suppressFollowUp: true':
  Respond only with something like:
     - "Take a look at the results above"
- Do not attempt to call a tool that you have not been provided, let the user know that the requested action is not supported.

Confirmation Handling:
- Before executing any tool where the parameter "requiresConfirmation" is true or the description contains the term "requiresConfirmation":
  1. Always call the \`askForConfirmation\` tool to request explicit user confirmation.
  2. STOP your response immediately after calling \`askForConfirmation\` without providing any additional information or context.
  3. Wait for the user to explicitly confirm or reject the action in a separate response.
  4. Ask for confirmation when the user is creating an action.
  5. Never ask for confirmation if the user has enabled \`degenMode\`.
- Post-Confirmation Execution:
  - If the user confirms:
    1. Only proceed with executing the tool in a new response after the confirmation.
  - If the user rejects:
    1. Acknowledge the rejection (e.g., "Understood, the action will not be executed").
    2. Do not attempt the tool execution.
- Behavioral Guidelines:
  1. NEVER chain the confirmation request and tool execution within the same response.
  2. NEVER execute the tool without explicit confirmation from the user.
  3. Treat user rejection as final and do not prompt again for the same action unless explicitly instructed.

Scheduled Actions:
- Scheduled actions are automated tasks that are executed at specific intervals.
- These actions are designed to perform routine operations without manual intervention.
- Always ask for confirmation using the \`askForConfirmation\` tool before scheduling any action. Obey the rules outlined in the "Confirmation Handling" section.
- If previous tool result is \`createActionTool\`, response only with something like:
  - "The action has been scheduled successfully"

Response Formatting:
- Use proper line breaks between different sections of your response for better readability
- Utilize markdown features effectively to enhance the structure of your response
- Keep responses concise and well-organized
- Use emojis sparingly and only when appropriate for the context
- Use an abbreviated format for transaction signatures

Realtime knowledge:
- { approximateCurrentTime: ${new Date().toISOString()}}
`;

export const defaultModel = usingAnthropic ? claude35Sonnet : openAiModel;

export interface ToolConfig {
  displayName?: string;
  icon?: ReactNode;
  isCollapsible?: boolean;
  isExpandedByDefault?: boolean;
  description: string;
  parameters: z.ZodType<any>;
  execute?: <T>(
    params: z.infer<T extends z.ZodType ? T : never>,
  ) => Promise<any>;
  render?: (props: { data: any }) => React.ReactNode | null;
  agentKit?: any;
  userId?: any;
  requiresConfirmation?: boolean;
  requiredEnvVars?: string[];
}

export function DefaultToolResultRenderer({ result }: { result: unknown }) {
  if (result && typeof result === 'object' && 'error' in result) {
    return (
      <Card className="bg-card p-4">
        <div className="pl-3.5 text-sm">
          {String((result as { error: unknown }).error)}
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-2 border-l border-border/40 pl-3.5 font-mono text-xs text-muted-foreground/90">
      <pre className="max-h-[200px] max-w-[400px] truncate whitespace-pre-wrap break-all">
        {JSON.stringify(result, null, 2).trim()}
      </pre>
    </div>
  );
}

export const defaultTools: Record<string, ToolConfig> = {
  ...actionTools,
  ...jinaTools,
  ...utilTools,
  ...telegramTools,
  ...magicEdenTools,
  ...bitcoinTools,
  ...mempoolTools
};

export function filterTools(
  tools: Record<string, ToolConfig>,
): Record<string, ToolConfig> {
  const disabledTools = process.env.NEXT_PUBLIC_DISABLED_TOOLS
    ? JSON.parse(process.env.NEXT_PUBLIC_DISABLED_TOOLS)
    : [];

  return Object.fromEntries(
    Object.entries(tools).filter(([toolName, toolConfig]) => {
      if (disabledTools.includes(toolName)) {
        return false;
      }
      if (toolConfig.requiredEnvVars) {
        for (const envVar of toolConfig.requiredEnvVars) {
          if (!process.env[envVar] || process.env[envVar] == '') {
            return false;
          }
        }
      }
      return true;
    }),
  );
}

export const orchestrationPrompt = `
You are Bitx, an AI assistant specialized in Bitcoin blockchain ordinals and runes protocol and DeFi operations.

Your Task:
Analyze the user's message and return the appropriate tools as a **JSON array of strings**.  

Rules:
- Only include the askForConfirmation tool if the user's message requires a transaction signature or if they are creating an action.
- Only return the toolsets in the format: ["toolset1", "toolset2", ...].  
- Do not add any text, explanations, or comments outside the array.
- Be complete — include all necessary toolsets to handle the request, if you're unsure, it's better to include the tool than to leave it out.
- If the request cannot be completed with the available toolsets, return an array describing the unknown tools ["INVALID_TOOL:\${INVALID_TOOL_NAME}"].

Available Tools:
${Object.entries(defaultTools)
  .map(([name, { description }]) => `- **${name}**: ${description}`)
  .join('\n')}
`;

export function getToolConfig(toolName: string): ToolConfig | undefined {
  return defaultTools[toolName];
}

export function getToolsFromRequiredTools(
  toolNames: string[],
): Record<string, ToolConfig> {
  const enabledTools = filterTools(defaultTools);
  return toolNames.reduce((acc: Record<string, ToolConfig>, toolName) => {
    const tool = enabledTools[toolName];
    if (tool) {
      acc[toolName] = tool;
    }
    return acc;
  }, {});
}
