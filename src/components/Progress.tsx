import { useDeck } from "../core/context";
import { getFlatIndex, getTotalFlatSlides } from "../core/reducer";

export function Progress() {
  const { state } = useDeck();
  const current = getFlatIndex(state);
  const total = getTotalFlatSlides(state);
  const progress = total > 1 ? current / (total - 1) : 0;

  return (
    <div className="mirion-progress" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      <div
        className="mirion-progress-bar"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
