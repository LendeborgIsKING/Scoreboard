import type { SportConfig, TimerVariant } from "./types";
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

export function resolveActiveVariant(
  cfg: SportConfig,
  timerVariantId: string,
): TimerVariant | undefined {
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
): number | undefined {
  const v = resolveActiveVariant(cfg, timerVariantId);
  if (v?.periodCap != null) return v.periodCap;
  return cfg.maxPeriods;
}
