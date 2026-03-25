'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode
} from 'react';

import {
  QueryBuilder,
  type QueryBuilderProps,
  type ControlElementsProp,
  type Classnames,
  type RuleGroupType,
  type RuleType,
  type FullField,
  type FullOperator,
  type FullCombinator,
  type Path,
  remove
} from 'react-querybuilder';
import { QueryBuilderDnD } from '@react-querybuilder/dnd';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { QBActionElement } from './qb-action-element';
import { QBValueSelector } from './qb-value-selector';
import { QBCombinatorSelector } from './qb-combinator-selector';
import { QBValueEditor } from './qb-value-editor';
import { QBNotToggle } from './qb-not-toggle';
import { QBDragHandle } from './qb-drag-handle';

const queryBuilderVariants = cva('qb-wrapper', {
  variants: {
    variant: {
      default: '',
      bordered: 'rounded-lg border bg-card p-4 shadow-sm',
      compact: 'text-xs [&_.rule]:py-1 [&_.rule]:px-2 [&_.rule]:gap-1',
      striped: '[&_.rule:nth-child(even)]:bg-muted/20'
    },
    size: {
      sm: '[&_.qb-control]:h-7 [&_.qb-control]:text-xs',
      default: '',
      lg: '[&_.qb-control]:h-10 [&_.qb-control]:text-sm'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
});

type BaseQBProps = QueryBuilderProps<RuleGroupType, FullField, FullOperator, FullCombinator>;

type QueryBuilderDocyrusProps = Omit<
  BaseQBProps,
  'controlElements' | 'controlClassnames'
>
& VariantProps<typeof queryBuilderVariants> & {
  className?: string;
  controlElements?: Partial<ControlElementsProp<FullField, string>>;
  controlClassnames?: Partial<Classnames>;
  animated?: boolean;
  draggable?: boolean;
  showRuleNumbers?: boolean;
  maxDepth?: number;
  emptyMessage?: ReactNode;
  showClearButton?: boolean;
  clearButtonLabel?: ReactNode;
  onRuleAdd?: () => void;
  onRuleRemove?: () => void;
  onGroupAdd?: () => void;
  onGroupRemove?: () => void;
  onClear?: () => void;
};

const docyrusControlElements: Partial<ControlElementsProp<FullField, string>> = {
  actionElement: QBActionElement,
  addGroupAction: QBActionElement,
  addRuleAction: QBActionElement,
  cloneGroupAction: QBActionElement,
  cloneRuleAction: QBActionElement,
  removeGroupAction: QBActionElement,
  removeRuleAction: QBActionElement,
  valueSelector: QBValueSelector,
  fieldSelector: QBValueSelector,
  operatorSelector: QBValueSelector,
  combinatorSelector: QBCombinatorSelector,
  valueEditor: QBValueEditor,
  notToggle: QBNotToggle,
  dragHandle: QBDragHandle
};

const RULE_BASE = 'flex items-center gap-2 rounded-md border border-border/50 bg-card/50 px-3 py-2 transition-all duration-200';
const RULE_GROUP_BASE = 'space-y-2 rounded-lg border-l-2 border-border py-2 pl-4 pr-2 [&_.ruleGroup]:bg-muted/30 [&_.ruleGroup]:border-blue-500/30 [&_.ruleGroup_.ruleGroup]:border-violet-500/30 [&_.ruleGroup_.ruleGroup_.ruleGroup]:border-amber-500/30';

const docyrusClassnames: Partial<Classnames> = {
  queryBuilder: 'space-y-2',
  ruleGroup: RULE_GROUP_BASE,
  header: 'flex flex-wrap items-center gap-2',
  body: 'space-y-2',
  rule: RULE_BASE,
  dndDragging: 'opacity-50 scale-[0.98]',
  dndOver: 'ring-2 ring-primary/50 bg-primary/5'
};

const ANIM_CSS = `
@keyframes qb-rule-in{0%{opacity:0;transform:translateY(-16px) scale(.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes qb-group-in{0%{opacity:0;transform:translateY(-20px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes qb-rule-out{0%{opacity:1;transform:translateX(0) scale(1)}100%{opacity:0;transform:translateX(24px) scale(.95)}}
@keyframes qb-group-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.88) translateY(-8px)}}
.qb-anim-in{animation:qb-rule-in .4s cubic-bezier(.16,1,.3,1) both}
.qb-anim-group-in{animation:qb-group-in .5s cubic-bezier(.16,1,.3,1) both}
.qb-anim-out{animation:qb-rule-out .25s ease-in both;pointer-events:none}
.qb-anim-group-out{animation:qb-group-out .3s ease-in both;pointer-events:none}
@media(prefers-reduced-motion:reduce){.qb-anim-in,.qb-anim-group-in,.qb-anim-out,.qb-anim-group-out{animation:none!important}}
`;

const defaultDescriptionGenerator = ({ path, qbId }: { path: Path; qbId: string }) => `Query builder group at path ${path.join('-')}, id ${qbId}`;

/** Query ağacındaki tüm rule ve group ID'lerini topla */
function collectIds(group: RuleGroupType): Set<string> {
  const ids = new Set<string>();

  if (group.id) ids.add(group.id);

  for (const r of group.rules) {
    if (typeof r === 'string') continue;

    if ('rules' in r) {
      for (const id of collectIds(r as RuleGroupType)) {
        ids.add(id);
      }
    } else if (r.id) {
      ids.add(r.id);
    }
  }

  return ids;
}

function QueryBuilderDocyrus({
  className,
  variant,
  size,
  controlElements,
  controlClassnames,
  animated = true,
  draggable = false,
  showRuleNumbers = false,
  maxDepth,
  emptyMessage,
  showClearButton = false,
  clearButtonLabel,
  onRuleAdd,
  onRuleRemove,
  onGroupAdd,
  onGroupRemove,
  onClear,
  onAddRule: onAddRuleProp,
  onAddGroup: onAddGroupProp,
  onRemove: onRemoveProp,
  onQueryChange: onQueryChangeProp,
  accessibleDescriptionGenerator: descriptionGeneratorProp,
  ...props
}: QueryBuilderDocyrusProps) {
  const [mounted, setMounted] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const removingRef = useRef(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isInitialRef = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (props.query && isInitialRef.current) {
      prevIdsRef.current = collectIds(props.query);
      isInitialRef.current = false;
    }
  }, [props.query]);

  const handleQueryChange = useCallback(
    (newQuery: RuleGroupType) => {
      onQueryChangeProp?.(newQuery);

      if (!animated || !wrapperRef.current || removingRef.current) return;

      const newIds = collectIds(newQuery);
      const prevIds = prevIdsRef.current;

      const addedIds: string[] = [];

      for (const id of newIds) {
        if (!prevIds.has(id)) addedIds.push(id);
      }

      prevIdsRef.current = newIds;

      if (addedIds.length === 0) return;

      requestAnimationFrame(() => {
        const wrapper = wrapperRef.current;

        if (!wrapper) return;

        for (const id of addedIds) {
          const el = wrapper.querySelector<HTMLElement>(
            `[data-rule-id="${id}"], [data-rule-group-id="${id}"]`
          );

          if (!el) continue;

          const isGroup = el.hasAttribute('data-rule-group-id');
          const animClass = isGroup ? 'qb-anim-group-in' : 'qb-anim-in';

          el.classList.add(animClass);
          el.addEventListener('animationend', () => el.classList.remove(animClass), { once: true });
        }
      });
    },
    [animated, onQueryChangeProp]
  );

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    const timer = setTimeout(() => setAnnouncement(''), 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddRule = useCallback(
    (rule: RuleType, parentPath: Path, query: RuleGroupType, context?: unknown) => {
      onRuleAdd?.();
      announce('Rule added');

      return onAddRuleProp?.(rule, parentPath, query, context) ?? rule;
    },
    [onRuleAdd, announce, onAddRuleProp]
  );

  const handleAddGroup = useCallback(
    (group: RuleGroupType, parentPath: Path, query: RuleGroupType, context?: unknown) => {
      onGroupAdd?.();
      announce('Group added');

      return onAddGroupProp?.(group, parentPath, query, context) ?? group;
    },
    [onGroupAdd, announce, onAddGroupProp]
  );

  const handleRemove = useCallback(
    (ruleOrGroup: RuleType | RuleGroupType, path: Path, query: RuleGroupType, context?: unknown) => {
      const isGroup = 'rules' in ruleOrGroup;

      if (isGroup) {
        onGroupRemove?.();
        announce('Group removed');
      } else {
        onRuleRemove?.();
        announce('Rule removed');
      }

      if (!animated || !wrapperRef.current || removingRef.current) {
        return onRemoveProp?.(ruleOrGroup, path, query, context) ?? true;
      }

      const ruleId = 'id' in ruleOrGroup ? (ruleOrGroup as { id?: string }).id : undefined;
      let target: HTMLElement | null = null;

      if (ruleId) {
        target = wrapperRef.current.querySelector(`[data-rule-id="${ruleId}"], [data-rule-group-id="${ruleId}"]`);
      }

      if (!target) {
        return onRemoveProp?.(ruleOrGroup, path, query, context) ?? true;
      }

      const animClass = isGroup ? 'qb-anim-group-out' : 'qb-anim-out';

      target.classList.add(animClass);

      let removed = false;
      const doRemove = () => {
        if (removed) return;
        removed = true;
        removingRef.current = true;
        const updatedQuery = remove(query, path);

        prevIdsRef.current = collectIds(updatedQuery);
        onQueryChangeProp?.(updatedQuery);
        removingRef.current = false;
      };

      target.addEventListener('animationend', doRemove, { once: true });
      setTimeout(doRemove, 400);

      return false;
    },
    [
      animated,
      onRuleRemove,
      onGroupRemove,
      announce,
      onRemoveProp,
      onQueryChangeProp
    ]
  );

  const handleClear = useCallback(() => {
    if (!props.query || props.query.rules.length === 0) return;

    onClear?.();
    announce('All rules cleared');

    const q = props.query;

    if (!q) return;
    const emptyQuery: RuleGroupType = { combinator: q.combinator, rules: [], id: q.id };

    if (!animated || !wrapperRef.current) {
      prevIdsRef.current = collectIds(emptyQuery);
      onQueryChangeProp?.(emptyQuery);

      return;
    }

    const wrapper = wrapperRef.current;
    const items = wrapper.querySelectorAll<HTMLElement>('.rule, .ruleGroup .ruleGroup');
    const count = items.length;

    if (count === 0) {
      prevIdsRef.current = collectIds(emptyQuery);
      onQueryChangeProp?.(emptyQuery);

      return;
    }

    let finished = 0;
    const done = () => {
      finished++;
      if (finished >= count) {
        removingRef.current = true;
        prevIdsRef.current = collectIds(emptyQuery);
        onQueryChangeProp?.(emptyQuery);
        removingRef.current = false;
      }
    };

    items.forEach((el, i) => {
      el.style.animationDelay = `${i * 40}ms`;
      const isGroup = el.classList.contains('ruleGroup');

      el.classList.add(isGroup ? 'qb-anim-group-out' : 'qb-anim-out');
      el.addEventListener('animationend', done, { once: true });
    });

    setTimeout(done, count * 40 + 400);
  }, [
    animated,
    props.query,
    announce,
    onClear,
    onQueryChangeProp
  ]);

  const mergedControlElements = useMemo(
    () => ({ ...docyrusControlElements, ...controlElements }),
    [controlElements]
  );

  const bodyClass = useMemo(() => {
    if (showRuleNumbers) {
      return 'space-y-2 [counter-reset:rule-counter] [&>.rule]:before:content-[counter(rule-counter)] [&>.rule]:[counter-increment:rule-counter] [&>.rule]:before:mr-2 [&>.rule]:before:text-xs [&>.rule]:before:text-muted-foreground [&>.rule]:before:font-mono';
    }

    return 'space-y-2';
  }, [showRuleNumbers]);

  const mergedClassnames = useMemo(
    () => ({
      ...docyrusClassnames,
      body: bodyClass,
      ...controlClassnames
    }),
    [bodyClass, controlClassnames]
  );

  if (!mounted) {
    return <div className={cn(queryBuilderVariants({ variant, size }), className)} />;
  }

  const qbElement = (
    <QueryBuilder
      controlElements={mergedControlElements}
      controlClassnames={mergedClassnames}
      accessibleDescriptionGenerator={descriptionGeneratorProp ?? defaultDescriptionGenerator}
      onAddRule={handleAddRule}
      onAddGroup={handleAddGroup}
      onRemove={handleRemove}
      onQueryChange={handleQueryChange}
      enableDragAndDrop={draggable}
      {...(maxDepth !== undefined ? { maxGroupLevel: maxDepth } : {})}
      {...props} />
  );

  const hasRules = (props.query?.rules?.length ?? 0) > 0;

  return (
    <div ref={wrapperRef} className={cn(queryBuilderVariants({ variant, size }), className)}>
      {animated && <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />}
      <div aria-live="polite" className="sr-only">{announcement}</div>
      {!hasRules && emptyMessage && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      {draggable ? <QueryBuilderDnD>{qbElement}</QueryBuilderDnD> : qbElement}
      {showClearButton && hasRules && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 gap-1 text-xs text-muted-foreground hover:text-destructive">
              {clearButtonLabel ?? 'Clear All'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all rules?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all rules and groups. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" size="sm" onClick={handleClear}>
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

QueryBuilderDocyrus.displayName = 'QueryBuilderDocyrus';

export { QueryBuilderDocyrus, queryBuilderVariants };
export type { QueryBuilderDocyrusProps };