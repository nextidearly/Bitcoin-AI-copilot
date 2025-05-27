'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname } from 'next/navigation';

import { SavedPrompt } from '@prisma/client';
import { Attachment, JSONValue } from 'ai';
import { useChat } from 'ai/react';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import ChatInterface from '@/app/(user)/chat/[id]/chat-interface';
import { SavedPromptsMenu } from '@/components/saved-prompts-menu';
import BlurFade from '@/components/ui/blur-fade';
import TypingAnimation from '@/components/ui/typing-animation';
import { useConversations } from '@/hooks/use-conversations';
import { useUser } from '@/hooks/use-user';
import { useWalletPortfolio } from '@/hooks/use-wallet-portfolio';
import { EVENTS } from '@/lib/events';
import {
  IS_SUBSCRIPTION_ENABLED,
  IS_TRIAL_ENABLED,
  cn,
  getTrialTokensFloat,
} from '@/lib/utils';
import {
  getSavedPrompts,
  setSavedPromptLastUsedAt,
} from '@/server/actions/saved-prompt';

import { IntegrationsGrid } from './components/integrations-grid';
import { ConversationInput } from './conversation-input';
import { getRandomSuggestions } from './data/suggestions';
import { SuggestionCard } from './suggestion-card';

interface SectionTitleProps {
  children: React.ReactNode;
}

function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground/80">
      {children}
    </h2>
  );
}

export function HomeContent() {
  const pathname = usePathname();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [isFetchingSavedPrompts, setIsFetchingSavedPrompts] =
    useState<boolean>(true);
  const suggestions = useMemo(() => getRandomSuggestions(4), []);
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState(() => uuidv4());
  const { user, isLoading: isUserLoading } = useUser();
  const [verifyingTx, setVerifyingTx] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const MAX_VERIFICATION_ATTEMPTS = 20;

  const { conversations, refreshConversations } = useConversations(user?.id);

  const resetChat = useCallback(() => {
    setShowChat(false);
    setChatId(uuidv4());
  }, []);

  useEffect(() => {
    async function fetchSavedPrompts() {
      try {
        const res = await getSavedPrompts();
        const savedPrompts = res?.data?.data || [];

        setSavedPrompts(savedPrompts);
      } catch (err) {
        console.error(err);
      }
      setIsFetchingSavedPrompts(false);
    }
    fetchSavedPrompts();
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

  const toggleTrialBanner = () => {
    setShowTrialBanner((prev) => !prev);
  };

  const RENDER_TRIAL_BANNER =
    IS_TRIAL_ENABLED &&
    !hasEAP &&
    !user?.subscription?.active &&
    !meetsTokenBalance &&
    showTrialBanner;
  const USER_HAS_TRIAL =
    IS_TRIAL_ENABLED &&
    !hasEAP &&
    !user?.subscription?.active &&
    meetsTokenBalance;
  const RENDER_SUB_BANNER =
    !hasEAP &&
    !user?.subscription?.active &&
    !RENDER_TRIAL_BANNER &&
    !USER_HAS_TRIAL;
  const RENDER_EAP_BANNER =
    !IS_SUBSCRIPTION_ENABLED &&
    !hasEAP &&
    !RENDER_TRIAL_BANNER &&
    !USER_HAS_TRIAL;

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
      >How can I help with?</div>

      <div className="mx-auto w-full max-w-3xl space-y-8">
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
