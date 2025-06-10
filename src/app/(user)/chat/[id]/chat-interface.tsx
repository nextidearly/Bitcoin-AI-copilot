'use client';

import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Image from 'next/image';

import { SavedPrompt } from '@prisma/client';
import { Attachment, JSONValue, Message } from 'ai';
import { useChat } from 'ai/react';
import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  LogOut,
  User,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { getToolConfig } from '@/ai/providers';
import { Confirmation } from '@/components/confimation';
import { ToolResult } from '@/components/message/tool-result';
import usePolling from '@/hooks/use-polling';
import { EVENTS } from '@/lib/events';
import { cn } from '@/lib/utils';
import { type ToolActionResult, ToolUpdate } from '@/types/util';

import { ConversationInput } from '../../home/conversation-input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ChatBubbleIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useLogin } from '@privy-io/react-auth';
import { BitxUser } from '@/types/db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';

// Types
interface UploadingImage extends Attachment {
  localUrl: string;
  uploading: boolean;
}

interface ImagePreview {
  src: string;
  alt: string;
  index?: number;
  attachments?: Required<Attachment>[];
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
  messageId: string;
  onPreviewImage: (preview: ImagePreview) => void;
}

interface ToolResult {
  toolCallId: string;
  result: any;
}

interface ChatMessageProps {
  message: Message;
  index: number;
  messages: Message[];
  setSavedPrompts: React.Dispatch<SetStateAction<SavedPrompt[]>>;
  onPreviewImage: (preview: ImagePreview) => void;
  addToolResult: (result: ToolResult) => void;
}

interface ImagePreviewDialogProps {
  previewImage: ImagePreview | null;
  onClose: () => void;
}

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  displayName?: string;
  result?: {
    result?: string;
    message: string;
  };
  state?: string;
  args?: any;
}

// Constants
const MAX_VISIBLE_ATTACHMENTS = 4;

const getGridLayout = (count: number) => {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-3 grid-rows-2';
};

const getImageStyle = (index: number, total: number) => {
  if (total === 1) return 'aspect-square max-w-[300px]';
  if (total === 2) return 'aspect-square';
  if (total === 3 && index === 0) return 'col-span-2 aspect-[2/1]';
  return 'aspect-square';
};

const applyToolUpdates = (messages: Message[], toolUpdates: ToolUpdate[]) => {
  while (toolUpdates.length > 0) {
    const update = toolUpdates.pop();
    if (!update) {
      continue;
    }

    if (update.type === 'tool-update') {
      messages.forEach((msg) => {
        const toolInvocation = msg.toolInvocations?.find(
          (tool) => tool.toolCallId === update.toolCallId,
        ) as ToolInvocation | undefined;

        if (toolInvocation) {
          if (!toolInvocation.result) {
            toolInvocation.result = {
              result: update.result,
              message: toolInvocation.args?.message, // TODO: Don't think this is technically correct, but shouldn't affect UI
            };
          } else {
            toolInvocation.result.result = update.result;
          }
        }
      });
    }
  }

  return messages;
};

const useAnimationEffect = () => {
  useEffect(() => {
    document.body.classList.remove('animate-fade-out');
    document.body.classList.add('animate-fade-in');
    const timer = setTimeout(() => {
      document.body.classList.remove('animate-fade-in');
    }, 300);
    return () => clearTimeout(timer);
  }, []);
};

// Components
function InterfaceHeader({ user, isLoading, handleLogout }: { user: BitxUser, isLoading: boolean, handleLogout: any }) {
  const router = useRouter();
  const privyUser = user?.privyUser;

  const label = privyUser?.email?.address;
  const twitter = privyUser?.twitter;
  const twitterProfileImage = twitter?.profilePictureUrl;

  let { login } = useLogin({
    onComplete: async () => {
      router.push('/home');
    },
  });

  if (isLoading || !user) {
    return <></>;
  }

  return <div className='w-full flex justify-end sm:justify-between px-3.5 items-center py-3 sm:pt-2 relative z-40'>
    <div className='absolute sm:relative left-1/2 sm:left-0 top-1/2 -translate-x-1/2 sm:-translate-x-0 -translate-y-1/2'>
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

      </div> : <Button onClick={login} className='rounded-full'>Login</Button>
    }
  </div>
}

function MessageAttachments({
  attachments,
  messageId,
  onPreviewImage,
}: MessageAttachmentsProps) {
  const validAttachments = attachments.filter(
    (attachment): attachment is Required<Attachment> =>
      typeof attachment.contentType === 'string' &&
      typeof attachment.url === 'string' &&
      typeof attachment.name === 'string' &&
      attachment.contentType.startsWith('image/'),
  );

  if (validAttachments.length === 0) return null;

  return (
    <div
      className={cn(
        'grid w-full gap-1.5',
        getGridLayout(validAttachments.length),
      )}
    >
      {validAttachments
        .slice(0, MAX_VISIBLE_ATTACHMENTS)
        .map((attachment, index) => (
          <div
            key={`${messageId}-${index}`}
            className={cn(
              'group relative cursor-zoom-in overflow-hidden',
              getImageStyle(index, validAttachments.length),
              'rounded-lg shadow-sm transition-shadow duration-200 hover:shadow-md',
            )}
            onClick={() =>
              onPreviewImage({
                src: attachment.url,
                alt: attachment.name,
                index,
                attachments: validAttachments,
              })
            }
          >
            <Image
              src={attachment.url}
              alt={attachment.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {validAttachments.length > MAX_VISIBLE_ATTACHMENTS &&
              index === 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-medium text-white">
                  +{validAttachments.length - MAX_VISIBLE_ATTACHMENTS}
                </div>
              )}
          </div>
        ))}
    </div>
  );
}

function MessageToolInvocations({
  toolInvocations,
  addToolResult,
}: {
  toolInvocations: ToolInvocation[];
  addToolResult: (result: ToolResult) => void;
}) {
  return (
    <div className="space-y-px">
      {toolInvocations.map(
        ({ toolCallId, toolName, displayName, result, state, args }) => {
          const toolResult = result as ToolActionResult;
          if (toolName === 'askForConfirmation') {
            return (
              <div key={toolCallId} className="group">
                <Confirmation
                  message={args?.message}
                  result={toolResult?.result}
                  toolCallId={toolCallId}
                  addResultUtility={(result) =>
                    addToolResult({
                      toolCallId,
                      result: { result, message: args?.message },
                    })
                  }
                />
              </div>
            );
          }

          const isCompleted = result !== undefined;
          const isError =
            isCompleted &&
            typeof result === 'object' &&
            result !== null &&
            'error' in result;

          const config = getToolConfig(toolName);

          // Handle unknown tool with no config
          if (!config) {
            const header = (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-destructive/20',
                  )}
                />
                <span className="truncate text-xs font-medium text-foreground/90">
                  Tool Error
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                  {toolCallId.slice(0, 9)}
                </span>
              </div>
            );

            return (
              <div key={toolCallId} className="group">
                <ToolResult
                  toolName="Tool Error"
                  result={{
                    result: 'Tool Error',
                    error:
                      'An error occurred while processing your request, please try again or adjust your phrasing.',
                  }}
                  header={header}
                />
              </div>
            );
          }

          return (
            <div key={toolCallId} className="group">
              {isCompleted ? (
                <ToolResult
                  toolName={toolName}
                  result={result}
                  header={<></>}
                />
              ) : (
                  <>
                  <div className="mt-px px-3">
                    <div className="h-20 animate-pulse rounded-lg bg-muted/40" />
                  </div>
                </>
              )}
            </div>
          );
        },
      )}
    </div>
  );
}

function ChatMessage({
  message,
  index,
  messages,
  setSavedPrompts,
  onPreviewImage,
  addToolResult,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasAttachments =
    message.experimental_attachments &&
    message.experimental_attachments.length > 0;
  const isConsecutive = index > 0 && messages[index - 1].role === message.role;

  // Preprocess content to handle image dimensions
  const processedContent = message.content?.replace(
    /!\[(.*?)\]\((.*?)\s+=(\d+)x(\d+)\)/g,
    (_, alt, src, width, height) => `![${alt}](${src}#size=${width}x${height})`,
  );

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        isConsecutive ? 'mt-2' : 'mt-6',
        index === 0 && 'mt-0',
      )}
    >
      <div className="group relative flex sm:max-w-[85%] flex-row items-center">
        <div
          className={cn('relative gap-2', isUser ? 'items-end' : 'items-start')}
        >
          {hasAttachments && (
            <div
              className={cn('w-full max-w-[400px]', message.content && 'mb-2')}
            >
              <MessageAttachments
                attachments={message.experimental_attachments!}
                messageId={message.id}
                onPreviewImage={onPreviewImage}
              />
            </div>
          )}

          {message.content && (
            <div
              className={cn(
                'relative flex flex-col gap-2 rounded-2xl py-1 text-sm',
                isUser ? 'bg-muted px-4' : 'px-0',
              )}
            >
              <div
                className={cn(
                  'prose prose-sm max-w-prose break-words leading-tight md:prose-base',
                  isUser
                    ? 'prose-neutral dark:prose-invert'
                    : 'prose-neutral dark:prose-invert',
                )}
              >
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw]}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                    img: ({ node, alt, src, ...props }) => {
                      if (!src) return null;

                      try {
                        // Handle both relative and absolute URLs safely
                        const url = new URL(src, 'http://dummy.com');
                        const size = url.hash.match(/size=(\d+)x(\d+)/);

                        if (size) {
                          const [, width, height] = size;
                          // Remove hash from src
                          url.hash = '';
                          return (
                            <Image
                              src={url.pathname + url.search}
                              alt={alt || ''}
                              width={Number(width)}
                              height={Number(height)}
                              className="inline-block align-middle"
                            />
                          );
                        }
                      } catch (e) {
                        // If URL parsing fails, fallback to original src
                        console.warn('Failed to parse image URL:', e);
                      }

                      const thumbnailPattern = /_thumb\.(png|jpg|jpeg|gif)$/i;
                      const isThumbnail = thumbnailPattern.test(src);

                      const width = isThumbnail ? 40 : 500;
                      const height = isThumbnail ? 40 : 300;

                      // Fallback to Image component with default dimensions
                      return (
                        <Image
                          src={src}
                          alt={alt || ''}
                          width={width}
                          height={height}
                          className="inline-block align-middle"
                        />
                      );
                    },
                  }}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {message.toolInvocations && (
            <MessageToolInvocations
              toolInvocations={message.toolInvocations}
              addToolResult={addToolResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePreviewDialog({
  previewImage,
  onClose,
}: ImagePreviewDialogProps) {
  if (!previewImage) return null;

  const slides = previewImage.attachments
    ? previewImage.attachments.map((attachment) => ({
      src: attachment.url,
      alt: attachment.name,
    }))
    : [{ src: previewImage.src, alt: previewImage.alt }];

  const isSingleImage = slides.length === 1;

  return (
    <Lightbox
      open={!!previewImage}
      close={onClose}
      index={previewImage.index || 0}
      slides={slides}
      controller={{ closeOnBackdropClick: true }}
      styles={{
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
        },
        button: {
          filter: 'none',
          color: 'white',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(4px)',
        },
        navigationPrev: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(4px)',
          borderRadius: '9999px',
          margin: '0 8px',
          display: isSingleImage ? 'none' : undefined,
        },
        navigationNext: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(4px)',
          borderRadius: '9999px',
          margin: '0 8px',
          display: isSingleImage ? 'none' : undefined,
        },
      }}
      animation={{ fade: 300 }}
      carousel={{ finite: false }}
      toolbar={{
        buttons: [
          <button
            key="close"
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 backdrop-blur-xl transition-all duration-200 hover:bg-white/20"
            aria-label="Close preview"
          >
            <X className="h-5 w-5 text-white" />
          </button>,
        ],
      }}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
        buttonClose: () => null,
      }}
    />
  );
}

function LoadingMessage() {
  return (
    <div className="flex w-full items-start gap-3">
      <div className="relative flex sm:max-w-[85%] flex-col items-start gap-2">
        <div className="relative flex flex-col gap-2 rounded-2xl text-sm">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface({
  id,
  initialMessages = [],
}: {
  id: string;
  initialMessages?: Message[];
}) {
  const {
    messages: chatMessages,
    input,
    handleSubmit,
    handleInputChange,
    isLoading,
    addToolResult,
    data,
    setInput,
    setMessages,
  } = useChat({
    id,
    maxSteps: 10,
    initialMessages,
    sendExtraMessageFields: true,
    body: { id },
    onFinish: () => {
      if (window.location.pathname === `/chat/${id}`) {
        window.history.replaceState({}, '', `/chat/${id}`);
      }
      // Dispatch event to mark conversation as read
      window.dispatchEvent(new CustomEvent(EVENTS.CONVERSATION_READ));
    },
    experimental_prepareRequestBody: ({ messages }) => {
      return {
        message: messages[messages.length - 1],
        id,
      } as unknown as JSONValue;
    },
  });
  const { user, isLoading: isUserLoading, logout } = useUser();

  const messages = useMemo(() => {
    const toolUpdates = data as unknown as ToolUpdate[];
    if (!toolUpdates || toolUpdates.length === 0) {
      return chatMessages;
    }

    const updatedMessages = applyToolUpdates(chatMessages, toolUpdates);

    return updatedMessages;
  }, [chatMessages, data]);

  // Use polling for fetching new messages
  usePolling({
    url: `/api/chat/${id}`,
    onUpdate: (data: Message[]) => {
      if (!data) {
        return;
      }

      if (data && data.length) {
        setMessages(data);
      }

      window.dispatchEvent(new CustomEvent(EVENTS.CONVERSATION_READ));
    },
  });

  const [previewImage, setPreviewImage] = useState<ImagePreview | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSend = async (value: string, attachments: Attachment[]) => {
    if (!value.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // Create a synthetic event for handleSubmit
    const fakeEvent = {
      preventDefault: () => { },
      type: 'submit',
    } as React.FormEvent;

    // Prepare message data with attachments if present
    const currentAttachments = attachments.map(
      ({ url, name, contentType }) => ({
        url,
        name,
        contentType,
      }),
    );

    // Submit the message
    await handleSubmit(fakeEvent, {
      data: value,
      experimental_attachments: currentAttachments,
    });
    scrollToBottom();
  };

  useAnimationEffect();

  return (
    <div className="flex h-full flex-col">
      <InterfaceHeader user={user as BitxUser} isLoading={isUserLoading} handleLogout={logout} />

      <div className="no-scrollbar relative flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl">
          <div className="space-y-4 px-4 pb-36 pt-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                index={index}
                messages={messages}
                setSavedPrompts={setSavedPrompts}
                onPreviewImage={setPreviewImage}
                addToolResult={addToolResult}
              />
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role !== 'assistant' && (
                <LoadingMessage />
              )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10">
        <div className="relative mx-auto w-full max-w-3xl px-4 py-4">
          <ConversationInput
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            onChat={true}
            savedPrompts={savedPrompts}
            setSavedPrompts={setSavedPrompts}
          />
        </div>
      </div>

      <ImagePreviewDialog
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
