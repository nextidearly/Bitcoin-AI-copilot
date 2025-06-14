import { revalidatePath } from 'next/cache';

import {
  CoreTool,
  Message,
  NoSuchToolError,
  appendResponseMessages,
  createDataStreamResponse,
  generateObject,
  smoothStream,
  streamText,
} from 'ai';
import { performance } from 'perf_hooks';
import { z } from 'zod';

import {
  defaultModel,
  defaultSystemPrompt,
  defaultTools,
} from '@/ai/providers';
import { MAX_TOKEN_MESSAGES } from '@/lib/constants';
import { logWithTiming } from '@/lib/utils';
import {
  getConfirmationResult,
} from '@/lib/utils/ai';
import { generateTitleFromUserMessage } from '@/server/actions/ai';
import {
  dbCreateConversation,
  dbCreateMessages,
  dbDeleteConversation,
  dbGetConversationMessages,
} from '@/server/db/queries';
import { verifyUser } from '@/server/actions/verify-user';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = performance.now();

  //Check for valid user session and required parameters
  const session = await verifyUser();
  const userId = session?.data?.data?.id;
  const degenMode = session?.data?.data?.degenMode;

  try {
    // Get the (newest) message sent to the API
    const { id: conversationId, message }: { id: string; message: Message } =
      await req.json();
    if (!message) return new Response('No message found', { status: 400 });
    logWithTiming(startTime, '[chat/route] message received');

    if (userId) {
      logWithTiming(startTime, '[auth/message]');
      // Fetch existing messages for the conversation
      const existingMessages =
        (await dbGetConversationMessages({
          conversationId,
          limit: MAX_TOKEN_MESSAGES,
          isServer: true,
        })) ?? [];

      logWithTiming(startTime, '[chat/route] fetched existing messages');

      if (existingMessages.length === 0 && message.role !== 'user') {
        return new Response('No user message found', { status: 400 });
      }

      // Create a new conversation if it doesn't exist
      if (existingMessages.length === 0) {
        const title = await generateTitleFromUserMessage({
          message: message.content,
        });
        await dbCreateConversation({ conversationId, userId, title });
        revalidatePath('/api/conversations');
      }

      // Build the system prompt and append the history of attachments
      const attachments = existingMessages
        .filter((m) => m.experimental_attachments)
        .flatMap((m) => m.experimental_attachments!)
        .map((a) => ({ type: a.contentType, data: a.url }));

      const systemPrompt = [
        defaultSystemPrompt,
        `History of attachments: ${JSON.stringify(attachments)}`,
        `User ID: ${userId}`,
        `Conversation ID: ${conversationId}`,
        `Degen Mode: ${degenMode}`,
      ].join('\n\n');

      // Filter out empty messages and ensure sorting by createdAt ascending
      const relevant = existingMessages
        .filter(
          (m) => !(m.content === '' && (m.toolInvocations?.length ?? 0) === 0),
        )
        .sort(
          (a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0),
        );

      // Convert the message to a confirmation ('confirm' or 'deny') if it is for a confirmation prompt, otherwise add it to the relevant messages
      const confirmationResult = getConfirmationResult(message);
      if (confirmationResult !== undefined) {
        // Fake message to provide the confirmation selection to the model
        relevant.push({
          id: message.id,
          content: confirmationResult,
          role: 'user',
          createdAt: new Date(),
        });
      } else {
        relevant.push(message);
      }

      logWithTiming(startTime, '[chat/route] calling createDataStreamResponse');

      // Begin the stream response
      return createDataStreamResponse({
        execute: async (dataStream) => {
          if (dataStream.onError) {
            dataStream.onError((error: any) => {
              console.error(
                '[chat/route] createDataStreamResponse.execute dataStream error:',
                error,
              );
            });
          }

          // Begin streaming text from the model
          const result = streamText({
            model: defaultModel,
            system: systemPrompt,
            tools: defaultTools as Record<string, CoreTool<any, any>>,
            experimental_toolCallStreaming: true,
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'stream-text',
            },
            experimental_repairToolCall: async ({
              toolCall,
              tools,
              parameterSchema,
              error,
            }) => {
              if (NoSuchToolError.isInstance(error)) {
                return null;
              }

              console.log('[chat/route] repairToolCall', toolCall);

              const tool = tools[toolCall.toolName as keyof typeof tools];
              const { object: repairedArgs } = await generateObject({
                model: defaultModel,
                schema: tool.parameters as z.ZodType<any>,
                prompt: [
                  `The model tried to call the tool "${toolCall.toolName}"` +
                  ` with the following arguments:`,
                  JSON.stringify(toolCall.args),
                  `The tool accepts the following schema:`,
                  JSON.stringify(parameterSchema(toolCall)),
                  'Please fix the arguments.',
                ].join('\n'),
              });
              return { ...toolCall, args: JSON.stringify(repairedArgs) };
            },
            experimental_transform: smoothStream(),
            maxSteps: 15,
            messages: relevant,
            async onFinish({ response }) {
              if (!userId) return;
              try {
                logWithTiming(
                  startTime,
                  '[chat/route] streamText.onFinish complete',
                );

                const finalMessages = appendResponseMessages({
                  messages: [],
                  responseMessages: response.messages,
                }).filter(
                  (m) =>
                    // Accept either a non-empty message or a tool invocation
                    m.content !== '' || (m.toolInvocations || []).length !== 0,
                );

                // Increment createdAt by 1ms to avoid duplicate timestamps
                const now = new Date();
                finalMessages.forEach((m, index) => {
                  if (m.createdAt) {
                    m.createdAt = new Date(m.createdAt.getTime() + index);
                  } else {
                    m.createdAt = new Date(now.getTime() + index);
                  }
                });

                // Save the messages to the database
                await dbCreateMessages({
                  messages: finalMessages.map((m) => ({
                    conversationId,
                    createdAt: m.createdAt,
                    role: m.role,
                    content: m.content,
                    toolInvocations: m.toolInvocations
                      ? JSON.parse(JSON.stringify(m.toolInvocations))
                      : undefined,
                    experimental_attachments: m.experimental_attachments
                      ? JSON.parse(JSON.stringify(m.experimental_attachments))
                      : undefined,
                  })),
                });

                logWithTiming(
                  startTime,
                  '[chat/route] dbCreateMessages complete',
                );

                revalidatePath('/api/conversations');
              } catch (error) {
                console.error('[chat/route] Failed to save messages', error);
              }
            },
          });
          result.mergeIntoDataStream(dataStream);
        },
        onError: (_) => {
          return 'An error occurred';
        },
      });
    } else {
      logWithTiming(startTime, '[no-auth/message]');
      const systemPrompt = [
        defaultSystemPrompt,
        `Conversation ID: ${conversationId}`,
      ].join('\n\n');

      // // Filter out empty messages and ensure sorting by createdAt ascending
      const relevant: any = [];

      // Convert the message to a confirmation ('confirm' or 'deny') if it is for a confirmation prompt, otherwise add it to the relevant messages
      const confirmationResult = getConfirmationResult(message);
      if (confirmationResult !== undefined) {
        // Fake message to provide the confirmation selection to the model
        relevant.push({
          id: message.id,
          content: confirmationResult,
          role: 'user',
          createdAt: new Date(),
        });
      } else {
        relevant.push(message);
      }

      logWithTiming(startTime, '[chat/route] calling createDataStreamResponse');

      // Begin the stream response
      return createDataStreamResponse({
        execute: async (dataStream) => {
          if (dataStream.onError) {
            dataStream.onError((error: any) => {
              console.error(
                '[chat/route] createDataStreamResponse.execute dataStream error:',
                error,
              );
            });
          }

          // Begin streaming text from the model
          const result = streamText({
            model: defaultModel,
            system: systemPrompt,
            tools: defaultTools as Record<string, CoreTool<any, any>>,
            experimental_toolCallStreaming: true,
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'stream-text',
            },
            experimental_repairToolCall: async ({
              toolCall,
              tools,
              parameterSchema,
              error,
            }) => {
              if (NoSuchToolError.isInstance(error)) {
                return null;
              }

              console.log('[chat/route] repairToolCall', toolCall);

              const tool = tools[toolCall.toolName as keyof typeof tools];
              const { object: repairedArgs } = await generateObject({
                model: defaultModel,
                schema: tool.parameters as z.ZodType<any>,
                prompt: [
                  `The model tried to call the tool "${toolCall.toolName}"` +
                  ` with the following arguments:`,
                  JSON.stringify(toolCall.args),
                  `The tool accepts the following schema:`,
                  JSON.stringify(parameterSchema(toolCall)),
                  'Please fix the arguments.',
                ].join('\n'),
              });
              return { ...toolCall, args: JSON.stringify(repairedArgs) };
            },
            experimental_transform: smoothStream(),
            maxSteps: 15,
            messages: relevant,
            async onFinish({ response, usage }) {
              // if (!userId) return;
              try {
                logWithTiming(
                  startTime,
                  '[chat/route] streamText.onFinish complete',
                );

                const finalMessages = appendResponseMessages({
                  messages: [],
                  responseMessages: response.messages,
                }).filter(
                  (m) =>
                    // Accept either a non-empty message or a tool invocation
                    m.content !== '' || (m.toolInvocations || []).length !== 0,
                );

                // Increment createdAt by 1ms to avoid duplicate timestamps
                const now = new Date();
                finalMessages.forEach((m, index) => {
                  if (m.createdAt) {
                    m.createdAt = new Date(m.createdAt.getTime() + index);
                  } else {
                    m.createdAt = new Date(now.getTime() + index);
                  }
                });

                revalidatePath('/api/conversations');
              } catch (error) {
                console.error('[chat/route] Failed to save messages', error);
              }
            },
          });
          result.mergeIntoDataStream(dataStream);
        },
        onError: (_) => {
          return 'An error occurred';
        },
      });
    }

  } catch (error) {
    console.error('[chat/route] Unexpected error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await verifyUser();
  const userId = session?.data?.data?.id;

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { id: conversationId } = await req.json();
    await dbDeleteConversation({ conversationId, userId });
    revalidatePath('/api/conversations');

    return new Response('Conversation deleted', { status: 200 });
  } catch (error) {
    console.error('[chat/route] Delete error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
