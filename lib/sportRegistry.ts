import type { SportConfig, TimerVariant, CustomTimerFormat } from "./types";
import { CUSTOM_TIMER_VARIANT_ID } from "./types";
import { CUSTOM_TEMPLATE, presetById } from "./sportPresets";

/** Resolve active sport config — never hardcode per-sport UI; consume this object only. */
export function resolveSportConfig(
  sportId: string,
  customSport: SportConfig | null,
): SportConfig {
  if (sportId === "custom" && customSport) {
    return { ...customSport, id: "custom", name: customSport.name || "Custom" };
  }
  if (sportId === "custom") {
    return { ...CUSTOM_TEMPLATE, id: "custom" };
  }
  const preset = presetById(sportId);
  if (preset) return preset;
  return { ...CUSTOM_TEMPLATE, id: sportId, name: "Unknown" };
}

export function hasFeature(
  config: SportConfig,
  feature: SportConfig["features"][number],
): boolean {
  return config.features.includes(feature);
}

/** Pre-game toggles — only apply options the active sport supports */
export function gatePreGamePrefs(
  cfg: SportConfig,
  prefs: import("./types").PreGameSetupPrefs,
): import("./types").PreGameSetupPrefs {
  return {
    ...prefs,
    shotClockEnabled:
      hasFeature(cfg, "shotClock") && prefs.shotClockEnabled,
    stoppageTimeEnabled:
      hasFeature(cfg, "stoppageTime") && prefs.stoppageTimeEnabled,
    targetScoreEnabled:
      hasFeature(cfg, "targetScore") && prefs.targetScoreEnabled,
  };
}

export function resolveActiveVariant(
  cfg: SportConfig,
  timerVariantId: string,
  customFormat?: CustomTimerFormat | null,
): TimerVariant | undefined {
  if (timerVariantId === CUSTOM_TIMER_VARIANT_ID && customFormat) {
    return {
      id: CUSTOM_TIMER_VARIANT_ID,
      label: "Custom",
      periodSeconds: customFormat.periodSeconds,
      regulationPeriods: customFormat.regulationPeriods,
      periodLabel: cfg.periodLabel,
    };
  }
  const list = cfg.timerVariants;
  if (!list?.length) return undefined;
  const found = list.find((t) => t.id === timerVariantId);
  if (found) return found;
  const fallback =
    list.find((t) => t.id === cfg.defaultVariantId) ?? list[0];
  return fallback;
}

export function defaultVariantId(cfg: SportConfig): string {
  return cfg.defaultVariantId ?? cfg.timerVariants?.[0]?.id ?? "";
}

/** Max period/inning index for +Period button */
export function effectiveMaxPeriods(
  cfg: SportConfig,
  timerVariantId: string,
  customFormat?: CustomTimerFormat | null,
): number | undefined {
  const v = resolveActiveVariant(cfg, timerVariantId, customFormat);
  if (v?.periodCap != null) return v.periodCap;
  if (timerVariantId === CUSTOM_TIMER_VARIANT_ID && customFormat) {
    return customFormat.regulationPeriods;
  }
  return cfg.maxPeriods;
}

