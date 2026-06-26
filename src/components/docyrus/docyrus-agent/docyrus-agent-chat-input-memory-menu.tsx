'use client';

// @ts-nocheck
/* eslint-disable */
import { type ComponentType, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BrainCircuit } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

export interface DocyrusAgentChatInputMemoryMenuProps {
  /** Fires when "Extract Memories from Session" is selected. */
  onExtract?: () => void;
  /** Fires when "Manage Memories" is selected. */
  onManageMemories?: () => void;
  /** Disable the "Extract" item (e.g. when no thread / no messages yet). */
  canExtract?: boolean;
  /** Disable the "Manage Memories" item. */
  canManage?: boolean;
  /** Override the trigger icon. */
  icon?: ComponentType<{ className?: string }>;
  /** Tooltip / aria-label. */
  tooltip?: string;
  /** Override the dropdown content entirely (replaces both built-in items). */
  children?: ReactNode;
  /** Label override for the Extract item. */
  extractLabel?: ReactNode;
  /** Label override for the Manage item. */
  manageLabel?: ReactNode;
  className?: string;
}

/**
 * Compact `BrainCircuit` button that opens a dropdown with the standard memory actions:
 * extract memory candidates from the active session, and jump to the memory manager.
 *
 * Designed for the footer rail of `DocyrusAgentChatInput`, but unstyled enough to drop
 * anywhere. The dropdown content is overridable via `children` for fully custom actions.
 */
export const DocyrusAgentChatInputMemoryMenu = ({
  onExtract,
  onManageMemories,
  canExtract = true,
  canManage = true,
  icon: Icon = BrainCircuit,
  tooltip,
  children,
  extractLabel,
  manageLabel,
  className
}: DocyrusAgentChatInputMemoryMenuProps) => {
  const { t } = useUiTranslation();
  const label = tooltip ?? t('ui.agent.tools.extractMemories', 'Extract memories');

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={label}
              className={cn('size-6 text-muted-foreground hover:text-foreground', className)}
              size="icon"
              type="button"
              variant="ghost">
              <Icon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60" side="top">
        {children ?? (
          <>
            <DropdownMenuItem
              disabled={!canExtract || !onExtract}
              onSelect={() => onExtract?.()}>
              {extractLabel ?? t('ui.agent.tools.extractFromSession', 'Extract Memories from Session')}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canManage || !onManageMemories}
              onSelect={() => onManageMemories?.()}>
              {manageLabel ?? t('ui.agent.tools.manageMemories', 'Manage Memories')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};