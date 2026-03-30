import { useReducer, useRef, useMemo, useEffect, useCallback } from "react";
import { DeckContext } from "../core/context";
import { deckReducer, initialState } from "../core/reducer";
import type { DeckProps, IndexCounters } from "../core/types";
import { useNavigation } from "../hooks/useNavigation";
import { useHash } from "../hooks/useHash";
import { useAutoScale } from "../hooks/useAutoScale";
import { useSpeakerChannel } from "../hooks/useSpeakerChannel";
import { Progress } from "./Progress";
import { SlideNumber } from "./SlideNumber";
import { resetFragmentCounters } from "./Fragment";

const THUMB_SCALE = 0.2;
const THUMB_GAP = 40;

export function Deck({
  children,
  transition = "fade",
  width = 1920,
  height = 1080,
  background = "inherit",
  color = "inherit",
  progress = true,
  hash = true,
  keyboard = true,
  touch = true,
  onSlideChange,
}: DeckProps) {
  const [state, dispatch] = useReducer(deckReducer, initialState);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // Deck-scoped index counters. Reset each render, children claim during their render.
  const countersRef = useRef<IndexCounters>({ h: 0, vMap: new Map() });
  countersRef.current.h = 0;
  countersRef.current.vMap.clear();
  resetFragmentCounters();

  const scale = useAutoScale(slideContainerRef, width, height);
  const { openSpeakerWindow } = useSpeakerChannel(state);

  useNavigation({
    state,
    dispatch,
    keyboard,
    touch,
    containerRef,
    onOpenSpeaker: openSpeakerWindow,
  });

  useHash(state, dispatch, hash);

  // onSlideChange callback
  const prevRef = useRef({ h: state.h, v: state.v, fragment: state.fragment });
  const onSlideChangeRef = useRef(onSlideChange);
  onSlideChangeRef.current = onSlideChange;

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.h !== state.h || prev.v !== state.v || prev.fragment !== state.fragment) {
      onSlideChangeRef.current?.({
        h: state.h,
        v: state.v,
        fragment: state.fragment,
        prev: { h: prev.h, v: prev.v, fragment: prev.fragment },
      });
      prevRef.current = { h: state.h, v: state.v, fragment: state.fragment };
    }
  }, [state.h, state.v, state.fragment]);

  // Compute overview grid transforms
  const overviewTransforms = useMemo(() => {
    const transforms: Record<string, string> = {};
    if (!state.overview) return transforms;

    const thumbW = width * THUMB_SCALE;
    const thumbH = height * THUMB_SCALE;

    for (const slide of state.slides) {
      const x = slide.h * (thumbW + THUMB_GAP);
      const y = slide.v * (thumbH + THUMB_GAP);
      transforms[slide.id] = `translate(${x}px, ${y}px) scale(${THUMB_SCALE})`;
    }
    return transforms;
  }, [state.overview, state.slides, width, height]);

  // Compute overview deck dimensions
  const overviewDeckStyle = useMemo(() => {
    if (!state.overview) return {};

    const maxH = state.slides.reduce((max, s) => Math.max(max, s.h), 0);
    const maxV = state.slides.reduce((max, s) => Math.max(max, s.v), 0);
    const thumbW = width * THUMB_SCALE;
    const thumbH = height * THUMB_SCALE;
    const gridW = (maxH + 1) * (thumbW + THUMB_GAP) - THUMB_GAP;
    const gridH = (maxV + 1) * (thumbH + THUMB_GAP) - THUMB_GAP;

    return {
      width: `${gridW}px`,
      height: `${gridH}px`,
    };
  }, [state.overview, state.slides, width, height]);

  // Memoize context value to prevent unnecessary child re-renders
  const ctxValue = useMemo(
    () => ({
      state,
      dispatch,
      transition,
      width,
      height,
      overview: state.overview,
      overviewTransforms,
      counters: countersRef.current,
    }),
    [state, dispatch, transition, width, height, overviewTransforms]
  );

  return (
    <DeckContext.Provider value={ctxValue}>
      <div
        ref={containerRef}
        className="mirion-viewport"
        data-overview={state.overview || undefined}
        role="region"
        aria-roledescription="presentation"
        aria-label="Slide deck"
        style={{
          background,
          color,
          ["--mirion-width" as string]: `${width}px`,
          ["--mirion-height" as string]: `${height}px`,
        }}
      >
        <div
          ref={slideContainerRef}
          className="mirion-deck"
          data-overview={state.overview || undefined}
          style={
            state.overview
              ? overviewDeckStyle
              : {
                  width: `${width}px`,
                  height: `${height}px`,
                  transform: `scale(${scale})`,
                }
          }
        >
          {children}
        </div>
        {progress && <Progress />}
        <SlideNumber />
      </div>
    </DeckContext.Provider>
  );
}
