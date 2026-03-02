import { type RefObject, useEffect } from 'react';

type EventType = 'mousedown' | 'mouseup' | 'touchstart' | 'touchend' | 'focusin' | 'focusout';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: (event: Event) => void,
  eventType: EventType = 'mousedown'
): void {
  useEffect(() => {
    function callback(event: Event) {
      const target = event.target as Node;

      if (!target?.isConnected) {
        return;
      }

      const isOutside = Array.isArray(ref)
        ? ref
            .filter(item => Boolean(item.current))
            .every(item => item.current && !item.current.contains(target))
        : ref.current && !ref.current.contains(target);

      if (isOutside) {
        handler(event);
      }
    }

    window.addEventListener(eventType, callback);

    return () => {
      window.removeEventListener(eventType, callback);
    };
  }, [ref, handler, eventType]);
}