import React, { useEffect, useRef, useState } from 'react';

export type MobileStickyActionProps = {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  buttonClassName?: string;
  containerClassName?: string;
  hidden?: boolean;
  helperText?: string;
  badge?: React.ReactNode;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
  secondaryButtonClassName?: string;
};

function MobileStickyAction({
  label,
  icon,
  onClick,
  disabled = false,
  type = 'button',
  buttonClassName,
  containerClassName,
  hidden = false,
  helperText,
  badge,
  secondaryLabel,
  onSecondaryClick,
  secondaryDisabled = false,
  secondaryButtonClassName,
}: MobileStickyActionProps): JSX.Element | null {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let blurTimeout: number | undefined;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      if (!target) {
        return;
      }
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.getAttribute('contenteditable') === 'true';

      if (isTextInput) {
        if (target instanceof HTMLElement) {
          lastFocusedElementRef.current = target;
        }
        setKeyboardVisible((prev) => (prev ? prev : true));
      }
    };

    const handleFocusOut = () => {
      if (blurTimeout) {
        window.clearTimeout(blurTimeout);
      }
      blurTimeout = window.setTimeout(() => {
        setKeyboardVisible((prev) => (prev ? false : prev));
      }, 200);
    };

    const viewport = window.visualViewport;

    const handleViewportChange = () => {
      if (!viewport) {
        return;
      }
      const heightDelta = window.innerHeight - viewport.height;
      const isKeyboardLikelyOpen = heightDelta > 150;
      setKeyboardVisible((prev) =>
        prev === isKeyboardLikelyOpen ? prev : isKeyboardLikelyOpen
      );
      if (isKeyboardLikelyOpen) {
        const active = document.activeElement;
        if (active instanceof HTMLElement) {
          lastFocusedElementRef.current = active;
        }
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    viewport?.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      viewport?.removeEventListener('resize', handleViewportChange);
      if (blurTimeout) {
        window.clearTimeout(blurTimeout);
      }
    };
  }, []);

  useEffect(() => {
    if (keyboardVisible) {
      return;
    }
    if (typeof document === 'undefined') {
      return;
    }
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && activeElement !== document.body) {
      return;
    }
    const target = lastFocusedElementRef.current;
    if (target && target.isConnected) {
      window.requestAnimationFrame(() => {
        target.focus({ preventScroll: true });
      });
    }
  }, [keyboardVisible]);

  if (hidden || keyboardVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none md:hidden">
      <div
        className={`pointer-events-auto fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] ${
          containerClassName ?? ''
        }`}
      >
        <div className="space-y-2">
          {(helperText || badge) && (
            <div className="flex min-h-[2.75rem] items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-lime-100 via-yellow-50 to-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-lg shadow-amber-200/60 dark:from-amber-700 dark:via-amber-600 dark:to-amber-700 dark:text-amber-50 dark:shadow-amber-950/40">
              <span className="flex-1 text-left leading-relaxed">
                {helperText ?? ''}
              </span>
              {badge ? (
                <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-amber-500/20 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-300/20 dark:text-amber-50">
                  {badge}
                </span>
              ) : null}
            </div>
          )}
          <div className="flex flex-row gap-2">
            {secondaryLabel ? (
              <button
                type="button"
                onClick={onSecondaryClick}
                disabled={secondaryDisabled}
                className={`flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-700 shadow-soft transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-400 ${
                  secondaryButtonClassName ?? ''
                }`}
              >
                {secondaryLabel}
              </button>
            ) : null}
            <button
              type={type}
              onClick={onClick}
              disabled={disabled}
              className={`flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-base font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                buttonClassName ?? ''
              }`}
            >
              {label}
              {icon ? icon : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileStickyAction;
