import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Public site key — safe to expose in the browser. */
const SITE_KEY =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ??
  '0x4AAAAAAFRouxxotcfi73Ut';

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

/** Loads Cloudflare's official Turnstile script once, on demand. */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Turnstile requires a browser environment'));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Turnstile script failed to load')),
      );
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () =>
      reject(new Error('Turnstile script failed to load')),
    );
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export interface TurnstileWidgetHandle {
  /** Resets the challenge so a new token must be obtained. */
  reset: () => void;
}

export interface TurnstileWidgetProps {
  readonly onVerify: (token: string) => void;
  readonly onExpire?: () => void;
  readonly onError?: () => void;
}

/**
 * Cloudflare Turnstile widget (Managed mode, explicit render).
 *
 * Lightweight, client-side only: it obtains a token locally. There is no
 * server-side verification in this project yet, so it is a soft anti-bot layer,
 * not equivalent to server-side bot protection.
 */
const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    callbacksRef.current = { onVerify, onExpire, onError };

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          const widgetId = widgetIdRef.current;
          if (widgetId && window.turnstile) {
            window.turnstile.reset(widgetId);
          }
        },
      }),
      [],
    );

    useEffect(() => {
      let cancelled = false;

      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) {
            return;
          }
          if (widgetIdRef.current) {
            return;
          }

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            theme: 'light',
            size: 'flexible',
            callback: (token) => callbacksRef.current.onVerify(token),
            'expired-callback': () => callbacksRef.current.onExpire?.(),
            'error-callback': () => callbacksRef.current.onError?.(),
          });
        })
        .catch(() => {
          if (!cancelled) {
            callbacksRef.current.onError?.();
          }
        });

      return () => {
        cancelled = true;
        const widgetId = widgetIdRef.current;
        if (widgetId && window.turnstile) {
          window.turnstile.remove(widgetId);
        }
        widgetIdRef.current = null;
      };
    }, []);

    return <div className="turnstile-field" ref={containerRef} />;
  },
);

export default TurnstileWidget;
