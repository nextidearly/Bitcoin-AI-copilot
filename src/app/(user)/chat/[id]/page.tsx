import { Suspense } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { verifyUser } from '@/server/actions/verify-user';
import {
  dbGetConversation,
  dbGetConversationMessages,
} from '@/server/db/queries';

import ChatInterface from './chat-interface';

/**
 * Generates metadata for the chat page based on conversation details
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const conversation = await dbGetConversation({ conversationId: id });

  if (!conversation) {
    return {
      title: 'Chat Not Found',
      description: 'The requested chat conversation could not be found.',
    };
  }

  return {
    title: `Chat - ${conversation.title || 'Untitled Conversation'}`,
    description: `Chat conversation: ${conversation.title || 'Untitled Conversation'}`,
  };
}

/**
 * Component responsible for fetching and validating chat data
 * Handles authentication, data loading, and access control
 */
async function ChatData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await dbGetConversation({ conversationId: id });

  if (!conversation) {
    return notFound();
  }

  // Verify user authentication and access rights
  const authResponse = await verifyUser();
  const userId = authResponse?.data?.data?.id;

  // Check if user has access to private conversation
  if (
    conversation.visibility === 'PRIVATE' &&
    (!userId || conversation.userId !== userId)
  ) {
    return notFound();
  }

  // Load conversation messages
  const messagesFromDB = await dbGetConversationMessages({
    conversationId: id,
  });

  if (!messagesFromDB) {
    return notFound();
  }

  return <ChatInterface id={id} initialMessages={messagesFromDB} />;
}

/**
 * Main chat page component with loading state handling
 */
export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<></>}>
      <ChatData params={params} />
    </Suspense>
  );
}
