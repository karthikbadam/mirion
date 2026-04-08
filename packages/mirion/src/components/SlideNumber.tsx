import type { CSSProperties } from "react";
import { useDeck } from "../core/context";
import { getFlatIndex, getTotalFlatSlides } from "../core/reducer";

interface SlideNumberProps {
  className?: string;
  style?: CSSProperties;
}

export function SlideNumber({ className = "", style }: SlideNumberProps) {
  const { state } = useDeck();
  const current = getFlatIndex(state) + 1;
  const total = getTotalFlatSlides(state);

  return (
    <div className={`mirion-slide-number ${className}`} style={style}>
      {current} / {total}
    </div>
  );
}
