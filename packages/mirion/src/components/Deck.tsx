import { useReducer, useRef, useMemo, useEffect, useCallback, useState } from "react";
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

function useOverviewParams(): { thumbScale: number; thumbGap: number } {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (width <= 480) return { thumbScale: 0.45, thumbGap: 12 };
  if (width <= 768) return { thumbScale: 0.35, thumbGap: 20 };
  return { thumbScale: 0.2, thumbGap: 40 };
}

/**
 * On portrait mobile, render the deck at native viewport dimensions so content
 * displays at real pixel sizes instead of being scaled down via CSS transform.
 * This makes text readable and content fill the full screen width.
 */
function useResponsiveDimensions(
  designWidth: number,
  designHeight: number
): { effectiveWidth: number; effectiveHeight: number; isPortrait: boolean } {
  const [viewport, setViewport] = useState(() =>
    typeof window !== "undefined"
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: designWidth, h: designHeight }
  );

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isPortrait = viewport.w <= 768 && viewport.h > viewport.w;

  if (isPortrait) {
    // Use actual viewport dimensions so scale ≈ 1.0 and content renders at
    // native pixel sizes — no CSS transform shrinking text/layouts.
    return {
      effectiveWidth: viewport.w,
      effectiveHeight: viewport.h,
      isPortrait: true,
    };
  }

  return { effectiveWidth: designWidth, effectiveHeight: designHeight, isPortrait: false };
}

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

  const { effectiveWidth, effectiveHeight, isPortrait } = useResponsiveDimensions(width, height);
  const scale = useAutoScale(slideContainerRef, effectiveWidth, effectiveHeight);
  const { thumbScale, thumbGap } = useOverviewParams();
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

    const thumbW = effectiveWidth * thumbScale;
    const thumbH = effectiveHeight * thumbScale;

    for (const slide of state.slides) {
      const x = slide.h * (thumbW + thumbGap);
      const y = slide.v * (thumbH + thumbGap);
      transforms[slide.id] = `translate(${x}px, ${y}px) scale(${thumbScale})`;
    }
    return transforms;
  }, [state.overview, state.slides, effectiveWidth, effectiveHeight, thumbScale, thumbGap]);

  // Compute overview deck dimensions
  const overviewDeckStyle = useMemo(() => {
    if (!state.overview) return {};

    const maxH = state.slides.reduce((max, s) => Math.max(max, s.h), 0);
    const maxV = state.slides.reduce((max, s) => Math.max(max, s.v), 0);
    const thumbW = effectiveWidth * thumbScale;
    const thumbH = effectiveHeight * thumbScale;
    const gridW = (maxH + 1) * (thumbW + thumbGap) - thumbGap;
    const gridH = (maxV + 1) * (thumbH + thumbGap) - thumbGap;

    return {
      width: `${gridW}px`,
      height: `${gridH}px`,
    };
  }, [state.overview, state.slides, effectiveWidth, effectiveHeight, thumbScale, thumbGap]);

  // Memoize context value to prevent unnecessary child re-renders
  const ctxValue = useMemo(
    () => ({
      state,
      dispatch,
      transition,
      width: effectiveWidth,
      height: effectiveHeight,
      overview: state.overview,
      overviewTransforms,
      counters: countersRef.current,
    }),
    [state, dispatch, transition, effectiveWidth, effectiveHeight, overviewTransforms]
  );

  return (
    <DeckContext.Provider value={ctxValue}>
      <div
        ref={containerRef}
        className="mirion-viewport"
        data-overview={state.overview || undefined}
        data-portrait={isPortrait || undefined}
        role="region"
        aria-roledescription="presentation"
        aria-label="Slide deck"
        style={{
          background,
          color,
          ["--mirion-width" as string]: `${effectiveWidth}px`,
          ["--mirion-height" as string]: `${effectiveHeight}px`,
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
                  width: `${effectiveWidth}px`,
                  height: `${effectiveHeight}px`,
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
