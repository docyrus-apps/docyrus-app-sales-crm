'use client';

import { type ChangeEvent, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
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
import { ArrowLeftIcon } from 'lucide-react';

import { type AgentActionParam } from './types';

import { useDocyrusAgent } from './docyrus-agent-context';

/*
 * ============================================================================
 * Param Field
 * ============================================================================
 */

const ParamField = ({
  param,
  value,
  onChange
}: {
  param: AgentActionParam;
  value: string | number | boolean;
  onChange: (name: string, value: string | number | boolean) => void;
}) => {
  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(param.name, e.target.value);
    },
    [param.name, onChange]
  );

  const handleNumberChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(param.name, Number(e.target.value));
    },
    [param.name, onChange]
  );

  const handleBooleanChange = useCallback(
    (checked: boolean) => {
      onChange(param.name, checked);
    },
    [param.name, onChange]
  );

  const handleSelectChange = useCallback(
    (val: string) => {
      onChange(param.name, val);
    },
    [param.name, onChange]
  );

  switch (param.type) {
    case 'text':
      return (
        <Input
          onChange={handleTextChange}
          placeholder={param.placeholder}
          value={String(value)} />
      );

    case 'textarea':
      return (
        <Textarea
          className="min-h-20 resize-none"
          onChange={handleTextChange}
          placeholder={param.placeholder}
          value={String(value)} />
      );

    case 'number':
      return (
        <Input
          onChange={handleNumberChange}
          placeholder={param.placeholder}
          type="number"
          value={Number(value)} />
      );

    case 'boolean':
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={handleBooleanChange} />
      );

    case 'select':
      return (
        <Select onValueChange={handleSelectChange} value={String(value)}>
          <SelectTrigger>
            <SelectValue placeholder={param.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {param.options?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return null;
  }
};

/*
 * ============================================================================
 * Action Params Form
 * ============================================================================
 */

export interface DocyrusAgentActionParamsProps {
  className?: string;
}

export const DocyrusAgentActionParams = ({ className }: DocyrusAgentActionParamsProps) => {
  const {
    selectedAction,
    setSelectedAction,
    setActionPanelView,
    onExecuteAction,
    sources,
    t
  } = useDocyrusAgent();

  const [params, setParams] = useState<Record<string, string | number | boolean>>(() => {
    const defaults: Record<string, string | number | boolean> = {};

    if (selectedAction?.params) {
      for (const p of selectedAction.params) {
        if (p.defaultValue !== undefined) {
          defaults[p.name] = p.defaultValue;
        } else if (p.type === 'boolean') {
          defaults[p.name] = false;
        } else if (p.type === 'number') {
          defaults[p.name] = 0;
        } else {
          defaults[p.name] = '';
        }
      }
    }

    return defaults;
  });

  const [customPrompt, setCustomPrompt] = useState('');

  const handleParamChange = useCallback(
    (name: string, value: string | number | boolean) => {
      setParams(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleCustomPromptChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setCustomPrompt(e.target.value);
    },
    []
  );

  const handleBack = useCallback(() => {
    setSelectedAction(null);
    setActionPanelView('action-list');
  }, [setSelectedAction, setActionPanelView]);

  const handleExecute = useCallback(() => {
    if (!selectedAction) return;
    setActionPanelView('executing');
    onExecuteAction?.({
      actionId: selectedAction.id,
      customPrompt: customPrompt || undefined,
      params,
      sources: sources.length > 0 ? sources : undefined
    });
  }, [
    selectedAction,
    params,
    customPrompt,
    sources,
    onExecuteAction,
    setActionPanelView
  ]);

  if (!selectedAction) return null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-2">
        <Button onClick={handleBack} size="icon-sm" type="button" variant="ghost">
          <ArrowLeftIcon className="size-4" />
        </Button>
        <h3 className="font-semibold text-sm">{selectedAction.label}</h3>
      </div>

      {selectedAction.params?.map(param => (
        <div className="space-y-1.5" key={param.name}>
          <Label className="text-sm">
            {param.label}
            {param.required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
          {param.description && (
            <p className="text-muted-foreground text-xs">{param.description}</p>
          )}
          <ParamField
            onChange={handleParamChange}
            param={param}
            value={params[param.name] ?? ''} />
        </div>
      ))}

      <div className="space-y-1.5">
        <Label className="text-sm">{t('daCustomPrompt')}</Label>
        <Textarea
          className="min-h-16 resize-none"
          onChange={handleCustomPromptChange}
          placeholder={t('daCustomPromptPlaceholder')}
          value={customPrompt} />
      </div>

      <Button className="w-full" onClick={handleExecute} type="button">
        {t('daExecute')}
      </Button>
    </div>
  );
};