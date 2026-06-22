'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { type DocyrusAgentMemoryLevel } from './docyrus-agent-memory-candidate-row';

export interface DocyrusAgentMemoryFormState {
  title: string;
  content: string;
  memoryLevel: string;
  importance: number;
  alwaysInclude: boolean;
}

export const EMPTY_MEMORY_FORM: DocyrusAgentMemoryFormState = {
  title: '',
  content: '',
  memoryLevel: 'user',
  importance: 5,
  alwaysInclude: false
};

export interface DocyrusAgentMemoryFormProps {
  value: DocyrusAgentMemoryFormState;
  onChange: (next: DocyrusAgentMemoryFormState) => void;
  levels: ReadonlyArray<DocyrusAgentMemoryLevel>;
  disabled?: boolean;
  /** Slot rendered above the title input. */
  header?: ReactNode;
  /** Slot rendered below the alwaysInclude switch. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Controlled form fields for creating / editing a memory. Used inside
 * `DocyrusAgentMemoryFormDialog` but exported standalone so apps can host the form in a
 * sheet, drawer, or full page if they prefer.
 */
export const DocyrusAgentMemoryForm = ({
  value,
  onChange,
  levels,
  disabled,
  header,
  footer,
  className
}: DocyrusAgentMemoryFormProps) => {
  const { t } = useUiTranslation();

  const patch = (partial: Partial<DocyrusAgentMemoryFormState>) => onChange({ ...value, ...partial });

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {header}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="docyrus-agent-memory-title">{t('ui.agent.memories.title', 'Title')}</Label>
        <Input
          id="docyrus-agent-memory-title"
          value={value.title}
          disabled={disabled}
          placeholder={t('ui.agent.memories.titlePlaceholder', 'Short, descriptive title')}
          onChange={e => patch({ title: e.target.value })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="docyrus-agent-memory-content">{t('ui.agent.memories.content', 'Content')}</Label>
        <Textarea
          id="docyrus-agent-memory-content"
          rows={3}
          value={value.content}
          disabled={disabled}
          placeholder={t('ui.agent.memories.contentPlaceholder', 'Memory body the agent should remember.')}
          onChange={e => patch({ content: e.target.value })} />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>{t('ui.agent.memories.level', 'Level')}</Label>
          <Select
            value={value.memoryLevel}
            disabled={disabled}
            onValueChange={val => patch({ memoryLevel: val })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levels.map(level => (
                <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-24 flex-col gap-1.5">
          <Label htmlFor="docyrus-agent-memory-importance">{t('ui.agent.memories.importance', 'Importance')}</Label>
          <Input
            id="docyrus-agent-memory-importance"
            type="number"
            min={1}
            max={10}
            disabled={disabled}
            value={value.importance}
            onChange={e => patch({ importance: Number(e.target.value) || 0 })} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="docyrus-agent-memory-always-include" className="cursor-pointer">
          {t('ui.agent.memories.alwaysInclude', 'Always include in context')}
        </Label>
        <Switch
          id="docyrus-agent-memory-always-include"
          checked={value.alwaysInclude}
          disabled={disabled}
          onCheckedChange={checked => patch({ alwaysInclude: checked })} />
      </div>

      {footer}
    </div>
  );
};