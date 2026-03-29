import type { DeckState, DeckAction, SlideEntry } from "./types";

export const initialState: DeckState = {
  h: 0,
  v: 0,
  fragment: 0,
  overview: false,
  slides: [],
};

function findSlide(slides: SlideEntry[], h: number, v: number) {
  return slides.find((s) => s.h === h && s.v === v);
}

function getMaxVertical(slides: SlideEntry[], h: number): number {
  const vs = slides.filter((s) => s.h === h).map((s) => s.v);
  return vs.length > 0 ? Math.max(...vs) : 0;
}

function getMaxHorizontal(slides: SlideEntry[]): number {
  const hs = slides.map((s) => s.h);
  return hs.length > 0 ? Math.max(...hs) : 0;
}

function getFragmentCount(slides: SlideEntry[], h: number, v: number): number {
  return findSlide(slides, h, v)?.fragmentCount ?? 0;
}

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "TOGGLE_OVERVIEW":
      return { ...state, overview: !state.overview };

    case "NEXT": {
      if (state.overview) return state;
      const maxFrag = getFragmentCount(state.slides, state.h, state.v);
      if (state.fragment < maxFrag) {
        return { ...state, fragment: state.fragment + 1 };
      }
      const maxV = getMaxVertical(state.slides, state.h);
      if (state.v < maxV) {
        return { ...state, v: state.v + 1, fragment: 0 };
      }
      const maxH = getMaxHorizontal(state.slides);
      if (state.h < maxH) {
        return { ...state, h: state.h + 1, v: 0, fragment: 0 };
      }
      return state;
    }

    case "PREV": {
      if (state.overview) return state;
      if (state.fragment > 0) {
        return { ...state, fragment: state.fragment - 1 };
      }
      if (state.v > 0) {
        const newV = state.v - 1;
        const maxFrag = getFragmentCount(state.slides, state.h, newV);
        return { ...state, v: newV, fragment: maxFrag };
      }
      if (state.h > 0) {
        const newH = state.h - 1;
        const maxV = getMaxVertical(state.slides, newH);
        const maxFrag = getFragmentCount(state.slides, newH, maxV);
        return { ...state, h: newH, v: maxV, fragment: maxFrag };
      }
      return state;
    }

    case "GO_TO": {
      const maxH = getMaxHorizontal(state.slides);
      const h = Math.min(action.h, maxH);
      const maxV = getMaxVertical(state.slides, h);
      const v = Math.min(action.v, maxV);
      return { ...state, h, v, fragment: action.fragment ?? 0 };
    }

    case "REGISTER_SLIDE": {
      const existing = state.slides.find((s) => s.id === action.entry.id);
      if (existing) {
        return {
          ...state,
          slides: state.slides.map((s) =>
            s.id === action.entry.id ? { ...s, ...action.entry } : s
          ),
        };
      }
      return { ...state, slides: [...state.slides, action.entry] };
    }

    case "UNREGISTER_SLIDE": {
      return {
        ...state,
        slides: state.slides.filter((s) => s.id !== action.id),
      };
    }

    case "SET_FRAGMENT_COUNT": {
      return {
        ...state,
        slides: state.slides.map((s) =>
          s.id === action.id ? { ...s, fragmentCount: action.count } : s
        ),
      };
    }

    case "SET_NOTES": {
      return {
        ...state,
        slides: state.slides.map((s) =>
          s.id === action.id ? { ...s, notes: action.notes } : s
        ),
      };
    }

    default:
      return state;
  }
}

export function getFlatIndex(state: DeckState): number {
  const sorted = [...state.slides].sort((a, b) => a.h - b.h || a.v - b.v);
  const idx = sorted.findIndex((s) => s.h === state.h && s.v === state.v);
  return Math.max(0, idx);
}

export function getTotalFlatSlides(state: DeckState): number {
  return state.slides.length;
}
