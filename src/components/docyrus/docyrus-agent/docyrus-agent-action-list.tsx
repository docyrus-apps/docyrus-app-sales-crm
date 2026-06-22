'use client';

// @ts-nocheck
/* eslint-disable */
import { memo, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ZapIcon } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { type AgentAction } from './types';

import { useDocyrusAgent } from './docyrus-agent-context';

/*
 * ============================================================================
 * Action Card
 * ============================================================================
 */

const ActionCard = memo(({ action, onSelect }: { action: AgentAction; onSelect: (action: AgentAction) => void }) => {
  const handleClick = useCallback(() => {
    onSelect(action);
  }, [action, onSelect]);

  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors',
        'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      onClick={handleClick}
      type="button">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {action.icon ?? <ZapIcon className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{action.label}</span>
          {action.opensChat && (
            <Badge className="text-[10px]" variant="secondary">Chat</Badge>
          )}
        </div>
        {action.description && (
          <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">{action.description}</p>
        )}
      </div>
    </button>
  );
});

ActionCard.displayName = 'ActionCard';

/*
 * ============================================================================
 * Action List
 * ============================================================================
 */

export interface DocyrusAgentActionListProps {
  className?: string;
}

export const DocyrusAgentActionList = ({ className }: DocyrusAgentActionListProps) => {
  const { t } = useUiTranslation();
  const {
    actions, setSelectedAction, setActionPanelView
  } = useDocyrusAgent();

  const handleSelect = useCallback(
    (action: AgentAction) => {
      setSelectedAction(action);
      if (action.params && action.params.length > 0) {
        setActionPanelView('action-params');
      } else {
        setActionPanelView('executing');
      }
    },
    [setSelectedAction, setActionPanelView]
  );

  if (actions.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-muted-foreground text-sm', className)}>
        {t('ui.agent.noActions', 'No actions available')}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-2', className)}>
      {actions.map(action => (
        <ActionCard action={action} key={action.id} onSelect={handleSelect} />
      ))}
    </div>
  );
};