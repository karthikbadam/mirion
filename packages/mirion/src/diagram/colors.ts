import type { DiagramColorPreset } from "./types";

export interface ColorScheme {
  fill: string;
  border: string;
  text: string;
}

export const colorPresets: Record<DiagramColorPreset, ColorScheme> = {
  red:    { fill: "#f5cece", border: "#d98a8a", text: "#7a2e2e" },
  green:  { fill: "#c8e6c8", border: "#7ab87a", text: "#1e4a1e" },
  blue:   { fill: "#ccd4ef", border: "#7a8ec8", text: "#1e2e6a" },
  purple: { fill: "#deccef", border: "#9a72bb", text: "#3e1e6a" },
  olive:  { fill: "#e2dfbe", border: "#a8a478", text: "#4c4a1e" },
  teal:   { fill: "#c0e4e3", border: "#70abab", text: "#1e4a4a" },
  gray:   { fill: "#d8d8d8", border: "#999999", text: "#2a2a2a" },
};
