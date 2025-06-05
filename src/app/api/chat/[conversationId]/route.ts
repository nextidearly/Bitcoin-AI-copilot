import { NextRequest, NextResponse } from 'next/server';

import {
  dbGetConversationMessages,
} from '@/server/db/queries';
import { verifyUser } from '@/server/actions/verify-user';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await verifyUser();
  const userId = session?.data?.data?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;

  if (!conversationId) {
    return NextResponse.json(
      { error: 'Missing conversationId' },
      { status: 401 },
    );
  }

  try {
    const messages = await dbGetConversationMessages({
      conversationId,
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation messages not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error(
      `[chat/[conversationId]/route] Error fetching conversation: ${error}`,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
