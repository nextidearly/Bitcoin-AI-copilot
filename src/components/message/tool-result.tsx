'use client';

import { useState } from 'react';

import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';

import { DefaultToolResultRenderer, getToolConfig } from '@/ai/providers';
import { cn } from '@/lib/utils';

interface ToolResultProps {
  toolName: string;
  result: unknown;
  header: React.ReactNode;
}

export function ToolResult({ toolName, result, header }: ToolResultProps) {
  const config = getToolConfig(toolName);
  const isCollapsible = config?.isCollapsible === true;
  const [isOpen, setIsOpen] = useState(
    config?.isExpandedByDefault ?? !isCollapsible,
  );

  const content = config?.render
    ? config?.render(result as any)
    : DefaultToolResultRenderer({ result });
  if (!content) return null;

  const headerContent = (
    <div className="flex w-full items-center gap-2">
      {header}
      {/* {isCollapsible && (
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 transform',
          )}
        />
      )} */}
    </div>
  );

  if (!isCollapsible) {
    return (
      <div className="mt-2 w-full">
        <div className="mt-2 text-sm sm:text-base">{content}</div>
      </div>
    );
  }

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mt-2 w-full"
    >
      <Collapsible.Trigger className="w-full">
        <div className="w-full cursor-pointer rounded-lg bg-muted/40 px-3 py-2 transition-colors hover:bg-muted/60">
          {headerContent}
        </div>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <div className="mt-2 px-4">{content}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
