import type { ReactNode, CSSProperties, Dispatch } from "react";

// --- Transitions ---

export type TransitionType = "fade" | "slide" | "none";
export type FragmentAnimation = "fade-in" | "fade-up" | "fade-left" | "fade-right" | "none";

// --- Deck ---

export interface DeckProps {
  children: ReactNode;
  transition?: TransitionType;
  width?: number;
  height?: number;
  background?: string;
  color?: string;
  progress?: boolean;
  hash?: boolean;
  keyboard?: boolean;
  touch?: boolean;
  onSlideChange?: (event: SlideChangeEvent) => void;
}

export interface SlideChangeEvent {
  h: number;
  v: number;
  fragment: number;
  /** Previous values before this navigation */
  prev: { h: number; v: number; fragment: number };
}

// --- Slide ---

export interface SlideProps {
  children: ReactNode;
  transition?: TransitionType;
  className?: string;
  style?: React.CSSProperties;
}

export interface VerticalSlideProps {
  children: ReactNode;
  transition?: TransitionType;
  className?: string;
  style?: React.CSSProperties;
}

// --- Fragment ---

export interface FragmentProps {
  children: ReactNode;
  /** Explicit reveal order. If omitted, auto-increments by render order within the slide. */
  order?: number;
  animation?: FragmentAnimation;
  className?: string;
  style?: CSSProperties;
}

// --- Notes ---

export interface NotesProps {
  children: ReactNode;
}

// --- Internal State ---

export interface SlideEntry {
  id: string;
  h: number;
  v: number;
  fragmentCount: number;
  notes: string;
  transition?: TransitionType;
}

export interface DeckState {
  h: number;
  v: number;
  fragment: number;
  overview: boolean;
  slides: SlideEntry[];
}

export type DeckAction =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GO_TO"; h: number; v: number; fragment?: number }
  | { type: "TOGGLE_OVERVIEW" }
  | { type: "REGISTER_SLIDE"; entry: SlideEntry }
  | { type: "UNREGISTER_SLIDE"; id: string }
  | { type: "SET_FRAGMENT_COUNT"; id: string; count: number }
  | { type: "SET_NOTES"; id: string; notes: string };

// --- Index Counters (Deck-scoped) ---

export interface IndexCounters {
  h: number;
  vMap: Map<number, number>;
}

// --- Context ---

export interface DeckContextValue {
  state: DeckState;
  dispatch: Dispatch<DeckAction>;
  transition: TransitionType;
  width: number;
  height: number;
  overview: boolean;
  overviewTransforms: Record<string, string>;
  counters: IndexCounters;
}

export interface SlideContextValue {
  id: string;
  h: number;
  v: number;
  isActive: boolean;
  fragmentIndex: number;
}

// --- Speaker ---

export interface SpeakerMessage {
  type: "mirion-state";
  h: number;
  v: number;
  fragment: number;
  notes: string;
  totalSlides: number;
  timestamp: number;
}
