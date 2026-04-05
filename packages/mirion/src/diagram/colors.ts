import type { DiagramColorPreset } from "./types";

export interface ColorScheme {
  fill: string;
  border: string;
  text: string;
}

export const colorPresets: Record<DiagramColorPreset, ColorScheme> = {
  red:    { fill: "#fce4e4", border: "#d98a8a", text: "#7a2e2e" },
  green:  { fill: "#e2f2e2", border: "#88bb88", text: "#2e5a2e" },
  blue:   { fill: "#e0e6f6", border: "#8a9ad0", text: "#2e3e7a" },
  purple: { fill: "#ece0f6", border: "#aa8acc", text: "#4e2e7a" },
  olive:  { fill: "#eeecda", border: "#b8b488", text: "#5c5a2e" },
  teal:   { fill: "#ddf0ef", border: "#88bbbb", text: "#2e5a5a" },
  gray:   { fill: "#ebebeb", border: "#aaaaaa", text: "#3a3a3a" },
};
