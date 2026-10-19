"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";

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

/** Tailwind classes for reliable touch scrolling in menus (use on the single main scroll pane). */
export const MENU_SCROLL_PANE =
  "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]";

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
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <header
      className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div className="min-w-0 shrink-0">{left}</div>
      <div className="min-w-0 shrink-0">{right}</div>
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
    <div className="flex flex-col gap-3 px-5 pb-6 pt-4 sm:px-12">
      <h3 className="text-center font-stencil text-3xl">{title}</h3>
      {children}
    </div>
  );
}
