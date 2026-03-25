'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';

import { type Value } from 'platejs';

import { AnimatePresence, motion } from 'motion/react';
import { KEYS, NodeApi } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { Editor, EditorContainer } from '@/components/editor/editor';
import { cn } from '@/lib/utils';

import { MentionUsersContext } from '@/lib/editor-mention';

import { ACTIVITY_TYPE_CONFIG } from '@/components/docyrus/contact-activity-panel/activity-type-config';

import {
  type LogActivityFormProps,
  type LogActivityPayload,
  type LoggableActivityType,
  type SectionHandle,
  LOGGABLE_ACTIVITY_TYPES
} from './types';
import {
  LogActivityFormProvider,
  type LogActivityFormContextValue
} from './log-activity-form-context';
import { LogActivityEditorKit } from './log-activity-editor-kit';
import { LogActivityToolbar } from './log-activity-toolbar';
import { EmailSection } from './sections/email-section';
import { EventSection } from './sections/event-section';
import { TaskSection } from './sections/task-section';
import { StatusSection } from './sections/status-section';

const DEFAULT_PLACEHOLDERS: Record<LoggableActivityType, string> = {
  call: 'Log call notes...',
  comment: 'Add a comment...',
  status_update: 'Additional context...',
  email: 'Compose email body...',
  meeting: 'Meeting notes...',
  task: 'Task description...'
};

function extractMentionedUserIds(value: Value): Array<string> {
  const ids: Array<string> = [];

  function walk(nodes: Value) {
    for (const node of nodes) {
      if (node.type === KEYS.mention && typeof node.value === 'string') {
        ids.push(node.value);
      }

      if ('children' in node && Array.isArray(node.children)) {
        walk(node.children as Value);
      }
    }
  }

  walk(value);

  return [...new Set(ids)];
}

export function LogActivityForm({
  activityType: controlledType,
  defaultActivityType = 'call',
  onTypeChange,
  onSubmit,
  isSubmitting = false,
  mentionUsers = [],
  placeholder: placeholderProp,
  submitLabel = 'Log Activity',
  showKeyboardHint = true,
  disabled = false,
  className,
  emailAttachments = [],
  onAttach,
  onRemoveAttachment,
  events,
  taskHeaderFields,
  taskFooterFields,
  statusOptions
}: LogActivityFormProps) {
  const [internalType, setInternalType] = useState<LoggableActivityType>(defaultActivityType);
  const activeType = controlledType ?? internalType;

  const [isEmpty, setIsEmpty] = useState(true);
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(undefined);

  const emailRef = useRef<SectionHandle>(null);
  const eventRef = useRef<SectionHandle>(null);
  const taskRef = useRef<SectionHandle>(null);
  const statusRef = useRef<SectionHandle>(null);

  const editor = usePlateEditor(
    {
      id: 'log-activity-editor',
      plugins: LogActivityEditorKit,
      value: []
    },
    []
  );

  const resolvedPlaceholder = placeholderProp ?? DEFAULT_PLACEHOLDERS[activeType];

  const handleTypeChange = useCallback((type: LoggableActivityType) => {
    if (controlledType === undefined) {
      setInternalType(type);
    }

    onTypeChange?.(type);
  }, [controlledType, onTypeChange]);

  const getSectionRef = useCallback((): SectionHandle | null => {
    switch (activeType) {
      case 'email': return emailRef.current;

      case 'call':

      case 'meeting': return eventRef.current;

      case 'task': return taskRef.current;

      case 'status_update': return statusRef.current;

      default: return null;
    }
  }, [activeType]);

  const handleSubmit = useCallback(() => {
    if (disabled || isSubmitting) return;

    const value = editor.children as Value;
    const bodyText = NodeApi.string({ children: value, type: KEYS.p });
    const sectionRef = getSectionRef();
    const sectionData = sectionRef?.getData() ?? {};
    const sectionEmpty = sectionRef?.isEmpty() ?? true;

    if (bodyText.trim().length === 0 && sectionEmpty) return;

    const payload: LogActivityPayload = {
      type: activeType,
      body: value,
      bodyText,
      mentionedUserIds: extractMentionedUserIds(value),
      ...sectionData
    };

    onSubmit?.(payload);
    editor.tf.reset();
    sectionRef?.reset();
    setIsEmpty(true);
  }, [
    disabled,
    isSubmitting,
    editor,
    activeType,
    getSectionRef,
    onSubmit
  ]);

  useEffect(() => {
    const el = measureRef.current;

    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMeasuredHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const contextValue = useMemo<LogActivityFormContextValue>(
    () => ({
      mentionUsers,
      emailAttachments,
      onAttach,
      onRemoveAttachment
    }),
    [
      mentionUsers,
      emailAttachments,
      onAttach,
      onRemoveAttachment
    ]
  );

  const sectionIsEmpty = useCallback(() => {
    const sectionRef = getSectionRef();

    return sectionRef?.isEmpty() ?? true;
  }, [getSectionRef]);

  return (
    <MentionUsersContext.Provider value={contextValue.mentionUsers}>
      <LogActivityFormProvider value={contextValue}>
        <div className={cn('flex flex-col overflow-hidden rounded-lg border bg-background', className)}>
          {/* Tab bar */}
          <div className="flex items-center gap-1 overflow-x-auto border-b px-3 py-2">
            <div className="flex items-center gap-1 rounded-lg border p-0.5 shadow-xs">
              {LOGGABLE_ACTIVITY_TYPES.map((type) => {
                const config = ACTIVITY_TYPE_CONFIG[type];
                const Icon = config.icon;
                const isActive = activeType === type;

                return (
                  <motion.button
                    key={type}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    disabled={disabled}
                    onClick={() => handleTypeChange(type)}
                    className={cn(
                      'relative flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                      disabled && 'pointer-events-none opacity-50'
                    )}>
                    {isActive && (
                      <motion.div
                        layoutId="log-activity-type-highlight"
                        className="absolute inset-0 rounded-md bg-accent"
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }} />
                    )}
                    <span className="relative z-10 flex items-center gap-1">
                      <Icon className={cn('size-3', config.colorClass)} />
                      <span className="hidden sm:inline">{config.label}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Plate wraps both editor area and toolbar so hooks work in toolbar */}
          <Plate
            editor={editor}
            onChange={({ value }) => {
              const text = NodeApi.string({ children: value, type: KEYS.p });

              setIsEmpty(text.trim().length === 0);
            }}>
            {/* Animated form area */}
            <motion.div
              animate={measuredHeight !== undefined ? { height: measuredHeight } : undefined}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ overflow: 'hidden' }}>
              <div ref={measureRef}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeType}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}>
                    <div className="flex flex-col gap-2 px-3 pt-3 pb-2">
                      {/* Per-type section (above editor) */}
                      {activeType === 'email' && (
                        <EmailSection
                          ref={emailRef}
                          disabled={disabled}
                          attachments={emailAttachments}
                          onAttach={onAttach}
                          onRemoveAttachment={onRemoveAttachment} />
                      )}
                      {(activeType === 'call' || activeType === 'meeting') && (
                        <EventSection
                          ref={eventRef}
                          events={events}
                          disabled={disabled} />
                      )}
                      {activeType === 'task' && (
                        <TaskSection
                          ref={taskRef}
                          headerFields={taskHeaderFields}
                          footerFields={taskFooterFields}
                          disabled={disabled} />
                      )}
                      {activeType === 'status_update' && (
                        <StatusSection
                          ref={statusRef}
                          statusOptions={statusOptions}
                          disabled={disabled} />
                      )}

                      {/* Rich text editor (always present) */}
                      <EditorContainer variant="comment">
                        <Editor
                          variant="comment"
                          className="min-h-15 grow text-sm"
                          disabled={disabled}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleSubmit();
                            }
                          }}
                          placeholder={resolvedPlaceholder}
                          autoComplete="off" />
                      </EditorContainer>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Toolbar */}
            <LogActivityToolbar
              onSubmit={handleSubmit}
              submitLabel={submitLabel}
              showKeyboardHint={showKeyboardHint}
              isSubmitting={isSubmitting}
              disabled={disabled}
              isEmpty={isEmpty && sectionIsEmpty()} />
          </Plate>
        </div>
      </LogActivityFormProvider>
    </MentionUsersContext.Provider>
  );
}