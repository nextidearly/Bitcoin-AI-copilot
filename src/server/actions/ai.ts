'use server';

import { generateText } from 'ai';
import { z } from 'zod';

import { defaultModel } from '@/ai/providers';
import prisma from '@/lib/prisma';
import { ActionEmptyResponse, actionClient } from '@/lib/safe-action';

export async function generateTitleFromUserMessage({
  message,
}: {
  message: string;
}) {
  const { text: title } = await generateText({
    model: defaultModel,
    system: `\n
        - you will generate a short title based on the first message a user begins a conversation with
        - ensure it is not more than 80 characters long
        - the title should be a summary of the user's message
        - do not use quotes or colons
        - use "New chat" for greetings`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function convertUserResponseToBoolean(message: string) {
  const { text: rawBool } = await generateText({
    model: defaultModel,
    system: `\n
      - you will generate a boolean response based on a user's message content
      - only return true or false
      - if an explicit affirmative response cannot be determined, return false`,
    prompt: message,
  });

  return rawBool === 'true';
}

const renameSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
});

export const renameConversation = actionClient
  .schema(renameSchema)
  .action(
    async ({ parsedInput: { id, title } }): Promise<ActionEmptyResponse> => {
      try {
        await prisma.conversation.update({
          where: { id },
          data: { title },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: 'UNEXPECTED_ERROR' };
      }
    },
);