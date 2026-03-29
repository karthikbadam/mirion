import { useEffect, useRef, useCallback } from "react";
import type { DeckState, SpeakerMessage } from "../core/types";

export function useSpeakerChannel(state: DeckState) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel("mirion-speaker");
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  // Broadcast state changes
  useEffect(() => {
    if (!channelRef.current) return;

    const currentSlide = state.slides.find(
      (s) => s.h === state.h && s.v === state.v
    );

    const message: SpeakerMessage = {
      type: "mirion-state",
      h: state.h,
      v: state.v,
      fragment: state.fragment,
      notes: currentSlide?.notes ?? "",
      totalSlides: new Set(state.slides.map((s) => s.h)).size,
      timestamp: Date.now(),
    };

    channelRef.current.postMessage(message);
  }, [state.h, state.v, state.fragment, state.slides]);

  const openSpeakerWindow = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("speaker", "true");
    window.open(
      url.toString(),
      "mirion-speaker",
      "width=1000,height=700,menubar=no,toolbar=no"
    );
  }, []);

  return { openSpeakerWindow };
}
