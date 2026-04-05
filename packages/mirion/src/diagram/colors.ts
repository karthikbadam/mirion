import type { DiagramColorPreset } from "./types";

export interface ColorScheme {
  fill: string;
  border: string;
  text: string;
}

/** Light-mode presets: pastel fills, darker text. */
export const lightPresets: Record<DiagramColorPreset, ColorScheme> = {
  red:    { fill: "#f5cece", border: "#d98a8a", text: "#7a2e2e" },
  green:  { fill: "#c8e6c8", border: "#7ab87a", text: "#1e4a1e" },
  blue:   { fill: "#ccd4ef", border: "#7a8ec8", text: "#1e2e6a" },
  purple: { fill: "#deccef", border: "#9a72bb", text: "#3e1e6a" },
  olive:  { fill: "#e2dfbe", border: "#a8a478", text: "#4c4a1e" },
  teal:   { fill: "#c0e4e3", border: "#70abab", text: "#1e4a4a" },
  gray:   { fill: "#d8d8d8", border: "#999999", text: "#2a2a2a" },
};

/** Dark-mode presets: dark fills, accent-colored borders and text. */
export const darkPresets: Record<DiagramColorPreset, ColorScheme> = {
  red:    { fill: "#2a1818", border: "#8b4444", text: "#d4a0a0" },
  green:  { fill: "#182218", border: "#4a7a4a", text: "#a0d0a0" },
  blue:   { fill: "#181c2a", border: "#4a5a8b", text: "#a0b0d4" },
  purple: { fill: "#201828", border: "#6a4a8b", text: "#bba0d4" },
  olive:  { fill: "#22221a", border: "#8a8650", text: "#ccc8a0" },
  teal:   { fill: "#182222", border: "#4a7a7a", text: "#a0cccc" },
  gray:   { fill: "#222222", border: "#555555", text: "#bbbbbb" },
};
