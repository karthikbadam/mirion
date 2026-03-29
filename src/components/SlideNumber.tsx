import { useDeck } from "../core/context";
import { getFlatIndex, getTotalFlatSlides } from "../core/reducer";

export function SlideNumber() {
  const { state } = useDeck();
  const current = getFlatIndex(state) + 1;
  const total = getTotalFlatSlides(state);

  return (
    <div className="mirion-slide-number">
      {current} / {total}
    </div>
  );
}
