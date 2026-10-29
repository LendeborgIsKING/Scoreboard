"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";

/** Below this, text gets too small to read; layouts should be compact enough to stay above it. */
const MIN_FIT_SCALE = 0.6;

/** Prevent the page behind a full-screen menu from scrolling on phones. */
export function useLockPageScrollWhileOpen() {
  const { isMobile, mounted } = useIsMobileDevice();
  useEffect(() => {
    if (!mounted || !isMobile) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [isMobile, mounted]);
}

/**
 * Fills the remaining height, centers its content, and shrinks it uniformly
 * when it would not fit — so screens never need to scroll.
 */
export function FitScreen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const compute = () => {
      const availH = outer.clientHeight;
      const needH = inner.offsetHeight;
      if (!availH || !needH) return;
      setScale(
        needH > availH ? Math.max(MIN_FIT_SCALE, availH / needH) : 1,
      );
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className={`relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden ${className}`}
    >
      <div
        ref={innerRef}
        className="w-full shrink-0"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * On phones, render children at document root so menus aren't trapped inside the
 * scaled in-game scoreboard canvas (844×390).
 */
export function MobileMenuPortal({ children }: { children: ReactNode }) {
  const { isMobile, mounted } = useIsMobileDevice();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!mounted || !ready) return null;
  if (isMobile) return createPortal(children, document.body);
  return <>{children}</>;
}

export function MenuOverlayHeader({
  left,
  right,
  title,
}: {
  left: ReactNode;
  right: ReactNode;
  title?: string;
}) {
  return (
    <header className="relative z-10 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 bg-black px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="justify-self-start">{left}</div>
      <h2 className="truncate text-center text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">
        {title}
      </h2>
      <div className="justify-self-end">{right}</div>
    </header>
  );
}

export function MenuPanelBody({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-5 py-4">
      <h3 className="text-center font-stencil text-3xl">{title}</h3>
      {children}
    </div>
  );
}
