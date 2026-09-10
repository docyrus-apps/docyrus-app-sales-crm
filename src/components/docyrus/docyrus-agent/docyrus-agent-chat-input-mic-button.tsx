'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react'

import { type SpeechRecognitionTranscriptChunks } from '@/hooks/docyrus/use-speech-recognition'
import {
  PromptInputButton,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Mic } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

const RECORDING_CLASSES =
  'bg-destructive/10 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/20'

export interface DocyrusAgentChatInputMicButtonProps {
  /** Recording flag (controlled). */
  isRecording: boolean
  /** Fires when the user toggles the button. */
  onToggle: () => void
  /** Hide the button when the underlying API is unavailable. Defaults to `true`. */
  isSupported?: boolean
  /** Disable the button. */
  disabled?: boolean
  /** Override the icon. */
  icon?: ComponentType<{ className?: string }>
  /** Override the recording badge (defaults to a pulsing dot). Set to `null` to hide. */
  recordingBadge?: ReactNode | null
  /** Override the active state styling. */
  recordingClassName?: string
  /** Tooltip when idle. */
  tooltipIdle?: string
  /** Tooltip when recording. */
  tooltipRecording?: string
  className?: string
}

/**
 * Toolbar microphone button. Fully controlled — pair with `useSpeechRecognition` for the
 * browser glue, or wire to any other transcription source.
 *
 * The transcribed text must be applied to the textarea by the host; the easiest pattern
 * is to call `usePromptInputController().textInput.setInput(...)` (or `append(...)`) from
 * the `onTranscript` callback of `useSpeechRecognition`.
 */
export const DocyrusAgentChatInputMicButton = ({
  isRecording,
  onToggle,
  isSupported = true,
  disabled,
  icon: Icon = Mic,
  recordingBadge,
  recordingClassName,
  tooltipIdle,
  tooltipRecording,
  className,
}: DocyrusAgentChatInputMicButtonProps) => {
  const { t } = useUiTranslation()

  if (!isSupported) return null

  const label = isRecording
    ? (tooltipRecording ?? t('ui.agent.tools.stopRecording', 'Stop recording'))
    : (tooltipIdle ?? t('ui.agent.tools.microphone', 'Microphone'))

  const badge =
    recordingBadge === null
      ? null
      : (recordingBadge ?? (
          <span className="absolute -right-1 -top-1 size-2 animate-pulse rounded-full bg-destructive" />
        ))

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PromptInputButton
          aria-label={label}
          aria-pressed={isRecording}
          className={cn(
            'relative transition-all duration-200',
            isRecording && (recordingClassName ?? RECORDING_CLASSES),
            className,
          )}
          disabled={disabled}
          variant="ghost"
          onClick={onToggle}
        >
          <Icon className="size-4" />
          {isRecording && badge}
        </PromptInputButton>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

export interface UseDocyrusAgentMicTranscriptionArgs {
  /**
   * Separator placed between baseline / final / interim when joining. Defaults to a single
   * space. Use `'\n'` for newline-separated insertion. Ignored when `merge` is provided.
   */
  separator?: string
  /**
   * Fully custom merge strategy. Receives the captured baseline + the current session's
   * cumulative `final` and pending `interim` chunks, and must return the new textarea value.
   * Use this to insert at cursor position, format with punctuation, append on a new line
   * after each sentence, etc.
   */
  merge?: (args: { baseline: string; final: string; interim: string }) => string
  /**
   * When `true`, clears the textarea on `onStart` instead of capturing the existing value
   * as the baseline. Defaults to `false`.
   */
  clearOnStart?: boolean
}

export interface DocyrusAgentMicSpeechHandlers {
  onStart: () => void
  onEnd: () => void
  onTranscript: (chunks: SpeechRecognitionTranscriptChunks) => void
}

export interface UseDocyrusAgentMicTranscriptionResult {
  /** Spread into `useSpeechRecognition({ ...speechHandlers })`. */
  speechHandlers: DocyrusAgentMicSpeechHandlers
  /** Manually clear the captured baseline (e.g. after a custom commit flow). */
  resetBaseline: () => void
}

/**
 * Helper hook that wires a `useSpeechRecognition`-style transcript stream into the
 * textarea via `usePromptInputController()`. Captures the textarea value at session start
 * as a baseline, then live-overwrites with `baseline + final + interim` on every result
 * event so the user sees speech transcribed in real time. Customize the merge strategy
 * via `separator` or `merge`.
 *
 * @example
 * ```tsx
 * const mic = useDocyrusAgentMicTranscription();
 * const speech = useSpeechRecognition({ ...mic.speechHandlers });
 *
 * <DocyrusAgentChatInputMicButton
 *   isRecording={speech.isRecording}
 *   isSupported={speech.isSupported}
 *   onToggle={speech.toggle} />
 * ```
 */
export const useDocyrusAgentMicTranscription = ({
  separator = ' ',
  merge,
  clearOnStart = false,
}: UseDocyrusAgentMicTranscriptionArgs = {}): UseDocyrusAgentMicTranscriptionResult => {
  const controller = usePromptInputController()
  const baselineRef = useRef<string | null>(null)
  const mergeRef = useRef(merge)
  const separatorRef = useRef(separator)

  mergeRef.current = merge
  separatorRef.current = separator

  const resetBaseline = useCallback(() => {
    baselineRef.current = null
  }, [])

  const speechHandlers = useMemo<DocyrusAgentMicSpeechHandlers>(
    () => ({
      onStart: () => {
        if (clearOnStart) {
          baselineRef.current = ''
          controller.textInput.setInput('')

          return
        }

        baselineRef.current = controller.textInput.value
      },
      onEnd: () => {
        baselineRef.current = null
      },
      onTranscript: ({ final, interim }) => {
        const baseline = baselineRef.current ?? ''

        if (mergeRef.current) {
          controller.textInput.setInput(
            mergeRef.current({ baseline, final, interim }),
          )

          return
        }

        const sep = separatorRef.current
        const parts = [baseline, final, interim].filter(Boolean)

        controller.textInput.setInput(parts.join(sep))
      },
    }),
    [controller, clearOnStart],
  )

  return { speechHandlers, resetBaseline }
}
