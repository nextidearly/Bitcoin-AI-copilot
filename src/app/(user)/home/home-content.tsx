'use client';

import { useCallback, useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import { SavedPrompt } from '@prisma/client';
import { Attachment, JSONValue } from 'ai';
import { useChat } from 'ai/react';
import { ChartColumn, Check, FileText, Lightbulb, Loader2, PenLine, SquareTerminal, ChevronDown, LogOut, User, Activity, ChartBar, ActivitySquare, SatelliteIcon, Edit, Banknote } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import ChatInterface from '@/app/(user)/chat/[id]/chat-interface';
import { SavedPromptsMenu } from '@/components/saved-prompts-menu';
import { useConversations } from '@/hooks/use-conversations';
import { useUser } from '@/hooks/use-user';
import { EVENTS } from '@/lib/events';
import {
  cn,
} from '@/lib/utils';
import {
  setSavedPromptLastUsedAt,
} from '@/server/actions/saved-prompt';

import { ConversationInput } from './conversation-input';
import BlurFade from '@/components/ui/blur-fade';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { BitxUser } from '@/types/db';
import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function InterfaceHeader({ user, isLoading, handleLogout }: { user: BitxUser, isLoading: boolean, handleLogout: any }) {
  const router = useRouter();
  const privyUser = user?.privyUser;

  const label = privyUser?.email?.address;
  const twitter = privyUser?.twitter;
  const twitterProfileImage = twitter?.profilePictureUrl;

  const { login } = useLogin({
    onComplete: async () => {
      router.push('/home');
    },
  });

  return <div className='w-full flex justify-end sm:justify-between px-3.5 items-center py-3.5 sm:pt-2 relative z-40'>
    <div className='absolute sm:relative left-1/2 sm:left-0 top-1/2 -translate-x-1/2 sm:-translate-x-0 -translate-y-1/2 sm:-translate-y-0 '>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='flex gap-1 items-center hover:bg-muted py-2 px-3 rounded-lg cursor-pointer'>
            <span className='text-lg'>ORD-GPT</span>
            <ChevronDown size={18} className='text-gray-400' />
          </div>

        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" className='min-w-56 p-2 rounded-lg gap-0'>
          <DropdownMenuItem className='cursor-pointer w-full p-0'>
            <div className='rounded-lg hover:bg-muted w-full p-2 flex justify-between items-center'>
              <span>ORD-GPT</span>
              <Check size={18} />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className='w-full p-0 cursor-not-allowed text-gray-400'>
            <div className='rounded-lg hover:bg-muted w-full p-2'>Bitcoin-GPT</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    {
      privyUser ? <div className='flex gap-2 items-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
              <AvatarImage src={twitterProfileImage || undefined} />
              <AvatarFallback className="rounded-full bg-muted">
                <span className='uppercase font-semibold'>{label?.substring(0, 1)}</span>
              </AvatarFallback>
            </Avatar>

          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className='min-w-56 p-2 rounded-lg gap-0'>
            <DropdownMenuItem className='p-2 w-full cursor-pointer flex gap-1 items-center'>
              <User />
              <span>{label}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className='p-2 w-full cursor-pointer flex gap-1 items-center' onClick={() => handleLogout()}>
              <LogOut />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div> : <div className='flex gap-2 items-center'>
          <a
            href="/"
            className="py-2 px-4 border border-muted-foreground/10 text-sm sm:text-base rounded-3xl flex items-center gap-1 cursor-pointer hover:bg-muted duration-100"
          >
            <Edit size={16} strokeWidth={3} />
            New Chat
          </a>

        <Button onClick={login} className='rounded-full'>Login</Button>
      </div>
    }
  </div>
}

export function HomeContent() {
  const pathname = usePathname();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState(() => uuidv4());
  const { user, isLoading: isUserLoading, logout } = useUser();
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

  const mainContent = (
    <div
      className={cn(
        'mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6',
        'h-screen py-0',
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
              onClick={() => { setType('Trending collections today'); setInput('Trending collections today') }}
              className={`${type === 'Trending collections today' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 text-sm sm:text-base rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <ChartColumn size={16} color="#52b7cb" strokeWidth={3} />
              Trending collections this week
            </button>
            <button
              onClick={() => { setType('Trending runes today'); setInput('Trending runes today') }}
              className={`${type === 'Trending runes today' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 text-sm sm:text-base rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <ChartBar size={16} color="#52b7cb" strokeWidth={3} />
              Trending runes today
            </button>
            <button
              onClick={() => { setType('Recent activities for DOG•GO•TO•THE•MOON'); setInput('Recent activities for DOG•GO•TO•THE•MOON') }}
              className={`${type === 'Recent activities for DOG•GO•TO•THE•MOON' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 text-sm sm:text-base rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <Activity size={16} color="#c560e1" strokeWidth={3} />
              Recent activities for DOG•GO•TO•THE•MOON
            </button>
            <button
              onClick={() => { setType('Recent activities for nodemonkes'); setInput('Recent activities for nodemonkes') }}
              className={`${type === 'Recent activities for nodemonkes' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 text-sm sm:text-base rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <ActivitySquare size={16} color='#4825a7' strokeWidth={3} />
              Recent activities for nodemonkes
            </button>
            <button
              onClick={() => { setType('Bitcoin price today'); setInput('Bitcoin price today') }}
              className={`${type === 'Bitcoin price today' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 text-sm sm:text-base rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <SatelliteIcon size={16} color="#e6af19" strokeWidth={3} />
              Bitcoin price today
            </button>
            <button
              onClick={() => { setType('Wallet balance [your address]'); setInput('Wallet balance [your address]') }}
              className={`${type === 'Wallet balance [your address]' && 'bg-muted'} py-2 px-3 border border-muted-foreground/10 text-sm sm:text-base rounded-3xl text-muted-foreground flex items-center gap-1 cursor-pointer hover:bg-muted duration-100`}
            >
              <Banknote size={16} color="#a6af19" strokeWidth={3} />
              Wallet balance of {`[your address]`}
            </button>
          </div>
        </BlurFade>
      </div>
    </div>
  );

  return (
    <div className="relative h-screen">
      <InterfaceHeader user={user as BitxUser} isLoading={isUserLoading} handleLogout={logout} />

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
