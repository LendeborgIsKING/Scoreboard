import type { ThemeId } from "./types";

/**
 * Display / score numerals font for the in-game scoreboard.
 * Stadium keeps the stencil look; every other theme uses its own face.
 */
export const THEME_SCORE_FONT: Record<ThemeId, string> = {
  dark: "font-display-dark",
  neon: "font-display-neon",
  classic: "font-display-classic",
  stadium: "font-display-stadium",
  fire: "font-display-fire",
  ice: "font-display-ice",
  midnight: "font-display-midnight",
  gold: "font-display-gold",
  court: "font-display-court",
  retro: "font-display-retro",
  blackout: "font-display-blackout",
};

export function scoreFontClass(theme: string): string {
  const id = theme as ThemeId;
  return THEME_SCORE_FONT[id] ?? THEME_SCORE_FONT.dark;
}
