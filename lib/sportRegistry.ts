import type { SportConfig } from "./types";
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
