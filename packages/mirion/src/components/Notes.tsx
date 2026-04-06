import { useEffect, useContext } from "react";
import { DeckContext, SlideContext } from "../core/context";
import type { NotesProps } from "../core/types";

function toText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(toText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return toText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return "";
}

/**
 * Declare speaker notes for the current slide.
 * Renders nothing — just registers notes with the deck.
 */
export function Notes({ children }: NotesProps) {
  const deck = useContext(DeckContext);
  const slide = useContext(SlideContext);

  const dispatch = deck?.dispatch;
  const slideId = slide?.id;
  const slideExists = deck?.state.slides.some((s) => s.id === slideId) ?? false;

  useEffect(() => {
    if (!dispatch || !slideId || !slideExists) return;
    const text = toText(children);
    dispatch({ type: "SET_NOTES", id: slideId, notes: text });
  }, [children, dispatch, slideId, slideExists]);

  return null;
}
