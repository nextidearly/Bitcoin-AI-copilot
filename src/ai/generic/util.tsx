import { z } from 'zod';

export const utilTools = {
  askForConfirmation: {
    displayName: '⚠️ Confirmation',
    description: 'Confirm the execution of a function on behalf of the user.',
    parameters: z.object({
      message: z.string().describe('The message to ask for confirmation'),
    }),
  },
};
