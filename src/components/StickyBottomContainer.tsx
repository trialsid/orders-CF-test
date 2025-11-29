import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type StickyBottomContainerProps = {
  children: React.ReactNode;
  className?: string;
  onHeightChange?: (height: number) => void;
  hidden?: boolean;
};

export function StickyBottomContainer({
  children,
  className,
  onHeightChange,
  hidden = false,
}: StickyBottomContainerProps): JSX.Element | null {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!onHeightChange || !containerRef.current) return;

    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element) {
          onHeightChange(entry.contentRect.height);
        }
      }
    });

    observer.observe(element);
    onHeightChange(element.offsetHeight);

    return () => observer.disconnect();
  }, [onHeightChange]);

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
        ref={containerRef}
        className={`pointer-events-auto fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] ${
          className ?? ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}
