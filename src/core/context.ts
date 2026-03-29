import { createContext, useContext } from "react";
import type { DeckContextValue, SlideContextValue } from "./types";

export const DeckContext = createContext<DeckContextValue | null>(null);
export const SlideContext = createContext<SlideContextValue | null>(null);

export function useDeck(): DeckContextValue {
  const ctx = useContext(DeckContext);
  if (!ctx) throw new Error("useDeck must be used within a <Deck>");
  return ctx;
}

export function useSlide(): SlideContextValue {
  const ctx = useContext(SlideContext);
  if (!ctx) throw new Error("useSlide must be used within a <Slide>");
  return ctx;
}

export function useOverview(): boolean {
  const ctx = useContext(DeckContext);
  return ctx?.state.overview ?? false;
}
