"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePhoneLandscape } from "@/hooks/usePhoneLandscape";

type SettingsLayoutValue = {
  isPhoneLandscape: boolean;
};

const SettingsLayoutContext = createContext<SettingsLayoutValue>({
  isPhoneLandscape: false,
});

export function SettingsLayoutProvider({ children }: { children: ReactNode }) {
  const { isPhoneLandscape } = usePhoneLandscape();
  return (
    <SettingsLayoutContext.Provider value={{ isPhoneLandscape }}>
      {children}
    </SettingsLayoutContext.Provider>
  );
}

export function useSettingsLayout() {
  return useContext(SettingsLayoutContext);
}

/** Full-width row inside a two-column landscape settings panel. */
export function PanelWide({ children }: { children: ReactNode }) {
  const { isPhoneLandscape } = useSettingsLayout();
  if (!isPhoneLandscape) return <>{children}</>;
  return <div className="col-span-2 min-w-0">{children}</div>;
}

export function PanelGrid({ children }: { children: ReactNode }) {
  const { isPhoneLandscape } = useSettingsLayout();
  if (!isPhoneLandscape) {
    return <div className="flex flex-col gap-3">{children}</div>;
  }
  return (
    <div className="grid grid-cols-2 items-start gap-x-3 gap-y-1.5">
      {children}
    </div>
  );
}
