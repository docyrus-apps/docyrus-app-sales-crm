'use client';

// @ts-nocheck
/* eslint-disable */
import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';

export interface SpeechRecognitionTranscriptChunks {
  /** Cumulative finalized transcript for the current session. */
  final: string;
  /** Current pending (not-yet-finalized) interim segment. */
  interim: string;
}

export interface UseSpeechRecognitionArgs {
  /** BCP-47 language tag (e.g. `en-US`, `tr-TR`). Defaults to the navigator language. */
  lang?: string;
  /** Whether to keep listening after each result (defaults to `true`). */
  continuous?: boolean;
  /** Whether to surface partial transcripts as they stream (defaults to `true`). */
  interimResults?: boolean;
  /** Fires on every result event with the cumulative session transcript split into final + interim. */
  onTranscript?: (chunks: SpeechRecognitionTranscriptChunks) => void;
  /** Fires when the recognition session starts. */
  onStart?: () => void;
  /** Fires when the recognition session ends (manually stopped, error, or browser timeout). */
  onEnd?: () => void;
}

export interface UseSpeechRecognitionResult {
  /** Browser support flag. When `false`, `start`/`stop` are no-ops and `recognition` is `null`. */
  isSupported: boolean;
  isRecording: boolean;
  /** Cumulative finalized transcript for the current session. Cleared on `start` / `reset`. Interim (pending) text is not included — observe it via the `onTranscript` callback. */
  transcript: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  /** Clear the cumulative transcript buffer. */
  reset: () => void;
  /** Latest error from the browser API, if any. */
  error: string | null;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: Event & { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean; length: number }> }) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;

  const w = window as unknown as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Thin React wrapper around the browser's Web Speech API (`SpeechRecognition` /
 * `webkitSpeechRecognition`). Use it to wire `DocyrusAgentChatInputMicButton` (or any
 * custom UI) to a live transcription stream. When the API is unavailable, `isSupported`
 * is `false` and the controls are no-ops.
 */
export function useSpeechRecognition({
  lang,
  continuous = true,
  interimResults = true,
  onTranscript,
  onStart,
  onEnd
}: UseSpeechRecognitionArgs = {}): UseSpeechRecognitionResult {
  const Ctor = useMemo(() => getRecognitionCtor(), []);
  const isSupported = !!Ctor;

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onStartRef.current = onStart;
    onEndRef.current = onEnd;
  }, [onTranscript, onStart, onEnd]);

  useEffect(() => {
    if (!Ctor) return undefined;

    const instance = new Ctor();

    instance.lang = lang ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
    instance.continuous = continuous;
    instance.interimResults = interimResults;

    instance.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      setError(null);
      onStartRef.current?.();
    };

    instance.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];

        if (!result) continue;

        const chunk = result[0]?.transcript ?? '';

        if (result.isFinal) {
          final += chunk;
        } else {
          interim += chunk;
        }
      }

      const finalText = final.trim();
      const interimText = interim.trim();

      setTranscript(finalText);
      onTranscriptRef.current?.({ final: finalText, interim: interimText });
    };

    instance.onerror = (event) => {
      setError(event.error);
      setIsRecording(false);
      onEndRef.current?.();
    };

    instance.onend = () => {
      setIsRecording(false);
      onEndRef.current?.();
    };

    recognitionRef.current = instance;

    return () => {
      instance.abort();
      recognitionRef.current = null;
    };
  }, [
    Ctor,
    lang,
    continuous,
    interimResults
  ]);

  const start = useCallback(() => {
    const instance = recognitionRef.current;

    if (!instance || isRecording) return;
    setError(null);
    try {
      instance.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [isRecording]);

  const stop = useCallback(() => {
    const instance = recognitionRef.current;

    if (!instance || !isRecording) return;
    instance.stop();
  }, [isRecording]);

  const toggle = useCallback(() => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  }, [isRecording, start, stop]);

  const reset = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isSupported,
    isRecording,
    transcript,
    start,
    stop,
    toggle,
    reset,
    error
  };
}