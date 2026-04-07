// Core components
export { Deck } from "./components/Deck";
export { Slide } from "./components/Slide";
export { Fragment } from "./components/Fragment";
export { Notes } from "./components/Notes";
export { Progress } from "./components/Progress";
export { SlideNumber } from "./components/SlideNumber";
export { SpeakerView } from "./components/SpeakerView";

// Layouts
export { Center } from "./layouts/Center";
export { Split } from "./layouts/Split";
export { Stack } from "./layouts/Stack";

// Content
export { Title } from "./content/Title";
export { Code } from "./content/Code";
export { List } from "./content/List";

// Hooks (for advanced usage)
export { useDeck, useSlide, useOverview } from "./core/context";

// Types
export type {
  DeckProps,
  SlideProps,
  VerticalSlideProps,
  FragmentProps,
  NotesProps,
  TransitionType,
  FragmentAnimation,
  SlideChangeEvent,
  DeckState,
  SlideContextValue,
  DeckContextValue,
} from "./core/types";

// CSS — users must import this
import "./mirion.css";
import "./transitions/transitions.css";
