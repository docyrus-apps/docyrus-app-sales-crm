'use client';

// @ts-nocheck
/* eslint-disable */
import { type ComponentType, type ReactNode } from 'react';

import { PromptInputButton } from '@/components/ai-elements/prompt-input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Brain, FileSearch, Globe, Microscope, Ruler, SlidersHorizontal
} from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { useDocyrusAgent } from './docyrus-agent-context';
import { type AgentCapabilities, type AgentFeatureFlags } from './types';

const ACTIVE_CLASSES = 'bg-primary/10 text-primary ring-1 ring-primary/30 hover:bg-primary/20';

export interface FeatureMenuRow {
  /** Stable identifier (used as React key and `hideFeatures` matcher). */
  key: string;
  /** Icon node rendered to the left of the label. */
  icon?: ReactNode;
  /**
   * Row label. When omitted, `labelKey` + `labelFallback` are looked up via
   * `useUiTranslation()` at render time so translations stay reactive.
   */
  label?: ReactNode;
  /** i18n key used when `label` is not supplied. */
  labelKey?: string;
  /** English fallback for `labelKey` when no provider is wired. */
  labelFallback?: string;
  /**
   * Bind the switch to a key on the context `featureFlags`. When set, the menu reads
   * the current value from context and calls `setFeatureFlag(flag, value)` on toggle —
   * unless `active`/`onChange` are also supplied (those win).
   */
  flag?: keyof AgentFeatureFlags;
  /**
   * Only relevant for the default rows — the capability key that must be `true` on
   * `capabilities` for the row to render. Custom rows decide their own visibility
   * (omit them from `rows`/`extraRows` to hide).
   */
  capability?: keyof AgentCapabilities;
  /** Controlled state override. Otherwise resolved from context via `flag`. */
  active?: boolean;
  /** Controlled change handler. Otherwise resolved from context via `flag`. */
  onChange?: (value: boolean) => void;
}

/**
 * The five Docyrus-spec toolbar features (Web Search / Document Search / Thinking /
 * Deep Research / Work Canvas) as `FeatureMenuRow`s. Exported so developers can spread,
 * filter, or splice these into their own `rows`/`extraRows` configuration.
 */
export const DEFAULT_FEATURE_ROWS: ReadonlyArray<FeatureMenuRow> = [
  {
    key: 'webSearch',
    flag: 'webSearch',
    capability: 'supportWebSearch',
    icon: <Globe className="size-4 shrink-0 text-muted-foreground" />,
    labelKey: 'ui.agent.tools.webSearch',
    labelFallback: 'Web Search'
  },
  {
    key: 'documentSearch',
    flag: 'documentSearch',
    capability: 'supportDocumentSearch',
    icon: <FileSearch className="size-4 shrink-0 text-muted-foreground" />,
    labelKey: 'ui.agent.tools.documentSearch',
    labelFallback: 'Document Search'
  },
  {
    key: 'thinking',
    flag: 'thinking',
    capability: 'supportThinking',
    icon: <Brain className="size-4 shrink-0 text-muted-foreground" />,
    labelKey: 'ui.agent.tools.thinking',
    labelFallback: 'Thinking'
  },
  {
    key: 'deepResearch',
    flag: 'deepResearch',
    capability: 'supportDeepResearch',
    icon: <Microscope className="size-4 shrink-0 text-muted-foreground" />,
    labelKey: 'ui.agent.tools.deepResearch',
    labelFallback: 'Deep Research'
  },
  {
    key: 'workCanvas',
    flag: 'workCanvas',
    capability: 'supportWorkCanvas',
    icon: <Ruler className="size-4 shrink-0 text-muted-foreground" />,
    labelKey: 'ui.agent.tools.workCanvas',
    labelFallback: 'Work Canvas'
  }
];

export interface DocyrusAgentChatInputFeatureMenuRowHelpers {
  active: boolean;
  onChange: (value: boolean) => void;
}

export interface DocyrusAgentChatInputFeatureMenuProps {
  /**
   * Replace the row list entirely. When omitted, the five `DEFAULT_FEATURE_ROWS` are
   * rendered, filtered by `capabilities` and `hideFeatures`.
   */
  rows?: ReadonlyArray<FeatureMenuRow>;
  /** Rows appended after the defaults (or after `rows` when supplied). */
  extraRows?: ReadonlyArray<FeatureMenuRow>;
  /** Hide specific default rows by flag/key. Ignored when `rows` is supplied. */
  hideFeatures?: ReadonlyArray<keyof AgentFeatureFlags | string>;
  /** Replace the per-row renderer (icon + label + Switch by default). */
  renderRow?: (row: FeatureMenuRow, helpers: DocyrusAgentChatInputFeatureMenuRowHelpers) => ReactNode;
  /** Override the trigger icon. */
  triggerIcon?: ComponentType<{ className?: string }>;
  /** Override the active state styling on the trigger. */
  activeClassName?: string;
  /** Tooltip label / aria-label for the trigger. */
  tooltip?: string;
  className?: string;
}

/**
 * Single dropdown trigger that consolidates the toolbar feature toggles into one button.
 * Read+write through `useDocyrusAgent()` context by default; individual rows can be
 * controlled instead by supplying `active` + `onChange` on the `FeatureMenuRow`.
 *
 * Composition surface:
 * - `rows` — replace the entire list (e.g. with `[...DEFAULT_FEATURE_ROWS, customRow]`)
 * - `extraRows` — append rows after defaults
 * - `hideFeatures` — hide specific defaults by key
 * - `renderRow` — fully customize how each row is rendered
 * - `triggerIcon`, `activeClassName`, `tooltip`, `className` — trigger button overrides
 */
export const DocyrusAgentChatInputFeatureMenu = ({
  rows,
  extraRows,
  hideFeatures,
  renderRow,
  triggerIcon: TriggerIcon = SlidersHorizontal,
  activeClassName,
  tooltip,
  className
}: DocyrusAgentChatInputFeatureMenuProps) => {
  const { t } = useUiTranslation();
  const {
    capabilities, featureFlags, setFeatureFlag
  } = useDocyrusAgent();

  const baseRows = rows ?? DEFAULT_FEATURE_ROWS.filter((row) => {
    if (row.capability && !capabilities[row.capability]) return false;
    if (hideFeatures?.includes(row.key)) return false;

    return true;
  });

  const visibleRows = extraRows ? [...baseRows, ...extraRows] : baseRows;

  if (visibleRows.length === 0) return null;

  const resolveRowState = (row: FeatureMenuRow): DocyrusAgentChatInputFeatureMenuRowHelpers => {
    const fromContext = row.flag ? featureFlags[row.flag] : false;
    const active = row.active ?? fromContext;
    const flagKey = row.flag;
    const onChange = row.onChange ?? (flagKey ? (value: boolean) => setFeatureFlag(flagKey, value) : () => {});

    return { active, onChange };
  };

  const activeCount = visibleRows.filter(row => resolveRowState(row).active).length;
  const triggerLabel = tooltip ?? t('ui.agent.tools.options', 'Options');

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <PromptInputButton
              aria-label={triggerLabel}
              className={cn(
                'relative transition-all duration-200',
                activeCount > 0 && (activeClassName ?? ACTIVE_CLASSES),
                className
              )}
              variant="ghost">
              <TriggerIcon className="size-4" />
              {activeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </PromptInputButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{triggerLabel}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="min-w-56 p-2">
        <div className="flex flex-col gap-2">
          {visibleRows.map((row) => {
            const helpers = resolveRowState(row);

            if (renderRow) {
              return <div key={row.key}>{renderRow(row, helpers)}</div>;
            }

            const resolvedLabel = row.label ?? (row.labelKey ? t(row.labelKey, row.labelFallback ?? row.key) : row.key);

            return (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {row.icon}
                  <span className="truncate text-sm font-medium">{resolvedLabel}</span>
                </div>
                <Switch checked={helpers.active} onCheckedChange={helpers.onChange} />
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};