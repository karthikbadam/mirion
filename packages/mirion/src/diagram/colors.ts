import type { DiagramColorPreset } from "./types";

export interface ColorScheme {
  fill: string;
  border: string;
  text: string;
}

export const colorPresets: Record<DiagramColorPreset, ColorScheme> = {
  red: { fill: "#fce4e4", border: "#e8a0a0", text: "#8b3a3a" },
  green: { fill: "#e4f5e4", border: "#a0c8a0", text: "#3a6b3a" },
  blue: { fill: "#e4e8f5", border: "#a0a8d0", text: "#3a4a8b" },
  purple: { fill: "#ede4f5", border: "#b8a0d0", text: "#5a3a8b" },
  olive: { fill: "#f0eeda", border: "#c8c4a0", text: "#6b6a3a" },
  teal: { fill: "#e0f0f0", border: "#a0c8c8", text: "#3a6b6b" },
  gray: { fill: "#f0f0f0", border: "#c0c0c0", text: "#4a4a4a" },
};
