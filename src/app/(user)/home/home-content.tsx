'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname } from 'next/navigation';

import { SavedPrompt } from '@prisma/client';
import { Attachment, JSONValue } from 'ai';
import { useChat } from 'ai/react';
import { ChartColumn, FileText, Lightbulb, Loader2, PenLine, SquareTerminal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import ChatInterface from '@/app/(user)/chat/[id]/chat-interface';
import { SavedPromptsMenu } from '@/components/saved-prompts-menu';
import { useConversations } from '@/hooks/use-conversations';
import { useUser } from '@/hooks/use-user';
import { useWalletPortfolio } from '@/hooks/use-wallet-portfolio';
import { EVENTS } from '@/lib/events';
import {
  IS_TRIAL_ENABLED,
  cn,
  getTrialTokensFloat,
} from '@/lib/utils';
import {
  setSavedPromptLastUsedAt,
} from '@/server/actions/saved-prompt';

import { ConversationInput } from './conversation-input';
import BlurFade from '@/components/ui/blur-fade';

export function HomeContent() {
  const pathname = usePathname();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState(() => uuidv4());
  const { user, isLoading: isUserLoading } = useUser();
  const [type, setType] = useState('');

  const { conversations, refreshConversations } = useConversations(user?.id);

  const resetChat = useCallback(() => {
    setShowChat(false);
    setChatId(uuidv4());
  }, []);


  const { messages, input, handleSubmit, setInput } = useChat({
    id: chatId,
    initialMessages: [],
    body: { id: chatId },
    onFinish: () => {
      // Only refresh if we have a new conversation that's not in the list
      if (chatId && !conversations?.find((conv) => conv.id === chatId)) {
        refreshConversations().then(() => {
          // Dispatch event to mark conversation as read
          window.dispatchEvent(new CustomEvent(EVENTS.CONVERSATION_READ));
        });
      }
    },
    experimental_prepareRequestBody: ({ messages }) => {
      return {
        message: messages[messages.length - 1],
        id: chatId,
      } as unknown as JSONValue;
    },
  });

  const handleSend = async (value: string, attachments: Attachment[]) => {

    if (!value.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // Create a synthetic event for handleSubmit
    const fakeEvent = {
      preventDefault: () => { },
      type: 'submit',
    } as React.FormEvent;

    // Submit the message
    await handleSubmit(fakeEvent, {
      data: value,
      experimental_attachments: attachments,
    });

    // Update UI state and URL
    setShowChat(true);
    window.history.replaceState(null, '', `/chat/${chatId}`);
  };

  // Reset chat when pathname changes to /home
  useEffect(() => {
    if (pathname === '/home') {
      resetChat();
    }
  }, [pathname, resetChat]);

  // 监听浏览器的前进后退
  useEffect(() => {
    const handlePopState = () => {
      if (location.pathname === '/home') {
        resetChat();
      } else if (location.pathname === `/chat/${chatId}`) {
        setShowChat(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [chatId, resetChat]);

  const filteredPrompts = input.startsWith('/')
    ? savedPrompts.filter((savedPrompt) =>
      savedPrompt.title.toLowerCase().includes(input.slice(1).toLowerCase()),
    )
    : savedPrompts;

  function handlePromptMenuClick(subtitle: string) {
    setInput(subtitle);
  }

  async function updatePromptLastUsedAt(id: string) {
    try {
      const res = await setSavedPromptLastUsedAt({ id });
      if (!res?.data?.data) {
        throw new Error();
      }

      const { lastUsedAt } = res.data.data;

      setSavedPrompts((old) =>
        old.map((prompt) =>
          prompt.id !== id ? prompt : { ...prompt, lastUsedAt },
        ),
      );
    } catch (error) {
      console.error('Failed to update -lastUsedAt- for prompt:', { error });
    }
  }
  const hasEAP = user?.earlyAccess === true;

  const shouldCheckPortfolio =
    IS_TRIAL_ENABLED && !hasEAP && !user?.subscription?.active;

  const { data: portfolio, isLoading: isPortfolioLoading } =
    useWalletPortfolio();

  // Check if user meets the minimum token balance
  const meetsTokenBalance = useMemo(() => {
    if (!portfolio || !portfolio.tokens) return false;

    // Find the BITX token
    const bitxToken = portfolio.tokens.find(
      (token) => token.mint === process.env.NEXT_PUBLIC_BITX_MINT,
    );

    // Check the balance
    const balance = bitxToken?.balance || 0;

    const trialMinBalance = getTrialTokensFloat();

    return trialMinBalance && balance >= trialMinBalance;
  }, [portfolio]);

  // Handle loading states
  if (isUserLoading || (shouldCheckPortfolio && isPortfolioLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const USER_HAS_TRIAL =
    IS_TRIAL_ENABLED &&
    !hasEAP &&
    !user?.subscription?.active &&
    meetsTokenBalance;

  const USER_HAS_ACCESS =
    hasEAP || user?.subscription?.active || USER_HAS_TRIAL;

  const mainContent = (
    <div
      className={cn(
        'mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6',
        !USER_HAS_ACCESS ? 'h-screen py-0' : 'py-12',
      )}
    >
      <div
        className="mb-12 text-center text-xl font-semibold tracking-tight md:text-4xl lg:text-4xl"
      >What can I help with?</div>

      <div className="mx-auto w-full max-w-3xl space-y-4">
        <BlurFade delay={0.1}>
          <ConversationInput
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            savedPrompts={savedPrompts}
            setSavedPrompts={setSavedPrompts}
          />

          <SavedPromptsMenu
            input={input}
            isFetchingSavedPrompts={false}
            savedPrompts={savedPrompts}
            filteredPrompts={filteredPrompts}
            onPromptClick={handlePromptMenuClick}
            updatePromptLastUsedAt={updatePromptLastUsedAt}
            onHomeScreen={true}
          />
        </BlurFade>
        <BlurFade delay={0.3}>
          <div className='flex flex-wrap gap-3 px-0 sm:px-3 w-full'>
            <button
              onClick={() => setType('analyze')}
              className={`${type === 'analyze' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <ChartColumn size={16} color="#52b7cb" strokeWidth={3} />
              Analyze data
            </button>
            <button
              onClick={() => setType('brainstorm')}
              className={`${type === 'brainstorm' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <Lightbulb size={16} color="#e6af19" strokeWidth={3} />
              Brainstorm
            </button>
            <button
              onClick={() => setType('text')}
              className={`${type === 'text' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <FileText size={16} color="#e17833" strokeWidth={3} />
              Summarize text
            </button>
            <button
              onClick={() => setType('help')}
              className={`${type === 'help' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <PenLine size={16} color="#c560e1" strokeWidth={3} />
              Help me write
            </button>
            <button
              onClick={() => setType('code')}
              className={`${type === 'code' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <SquareTerminal size={16} color='#4825a7' strokeWidth={3} />
              Code
            </button>
          </div>
        </BlurFade>

      </div>

    </div>
  );

  return (
    <div className="relative h-screen">
      {!showChat && (
        <div
          className={cn(
            'absolute inset-0 overflow-y-auto overflow-x-hidden transition-opacity duration-300 ',
            showChat ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
        >
          {mainContent}
        </div>
      )}
      {showChat && (
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            showChat ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <ChatInterface id={chatId} initialMessages={messages} />
        </div>
      )}
    </div>
  );
}
