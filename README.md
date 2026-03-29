# Mirion

A minimal presentation engine for React. Bring your own design system. Mirion handles navigation, transitions, and layout while you style slides with Chakra UI, Tailwind, or plain CSS.

## Guiding Principles

- **Minimal styling** — Mirion provides structural CSS only. No opinions on fonts, colors, or spacing.
- **React-native** — Slides are components. Use hooks, state, and any React library inside them.
- **Composable** — Three orthogonal layers: layouts (spatial), content (typed helpers), animations (reveal/motion).
- **Keyboard-first** — Full keyboard navigation, touch/swipe, URL hash sync, and overview mode out of the box.

## Quick Start

```bash
npm install mirion
```

```tsx
import { Deck, Slide, Fragment, Center, Stack } from "mirion";
import "mirion/style.css";

function App() {
  return (
    <Deck transition="fade" background="#1a1a2e" color="#e0e0e0">
      <Slide>
        <Center>
          <h1>Hello Mirion</h1>
        </Center>
      </Slide>

      <Slide>
        <Stack gap="2rem">
          <h2>Step-through fragments</h2>
          <Fragment animation="fade-up"><p>First</p></Fragment>
          <Fragment animation="fade-up"><p>Second</p></Fragment>
          <Fragment animation="fade-up"><p>Third</p></Fragment>
        </Stack>
      </Slide>
    </Deck>
  );
}
```

## Features

| Feature | Details |
|---------|---------|
| Transitions | `fade`, `slide`, `none` — per-deck default or per-slide override |
| Fragments | Step-through reveals with `fade-in`, `fade-up`, `fade-left`, `fade-right` animations |
| Vertical slides | Nest `<Slide.Vertical>` inside a `<Slide>` for 2D navigation |
| Overview mode | Press `Escape` to see all slides in a grid, click to jump |
| Speaker notes | `<Notes>` component + `<SpeakerView>` in a second window via BroadcastChannel |
| Auto-scaling | Slides scale to fit any viewport via CSS transforms |
| Hash URLs | `#h/v/fragment` synced to browser history |
| Keyboard + touch | Arrow keys, Space, swipe gestures |
| Progress bar | GPU-composited `scaleX` animation |
| Slide number | Optional `current / total` counter |
| PDF export | `@media print` styles included |

## Components

### Core

| Component | Description |
|-----------|-------------|
| `<Deck>` | Root container. Props: `transition`, `width`, `height`, `background`, `color`, `progress`, `hash`, `keyboard`, `touch`, `onSlideChange` |
| `<Slide>` | A single slide. Props: `transition`, `className`, `style` |
| `<Slide.Vertical>` | Vertical sub-slide (nest inside `<Slide>`) |
| `<Fragment>` | Step-through reveal. Props: `animation`, `order`, `className`, `style` |
| `<Notes>` | Speaker notes (renders nothing, registers text with the deck) |
| `<Progress>` | Progress bar (included by default in Deck) |
| `<SlideNumber>` | Slide counter (included by default in Deck) |
| `<SpeakerView>` | Second-window speaker view with notes and preview |

### Layouts

Unstyled layout primitives — inline styles only, no CSS framework needed.

| Component | Description |
|-----------|-------------|
| `<Center>` | Centers children horizontally and vertically |
| `<Split>` | Side-by-side columns. Props: `sizes`, `gap` |
| `<Stack>` | Vertical stack. Props: `gap`, `align`, `justify` |

### Content

Minimal content helpers — `className` passthrough for full styling control.

| Component | Description |
|-----------|-------------|
| `<Title>` | Title + subtitle. Props: `title`, `subtitle`, `className` |
| `<Code>` | Code block with `<pre><code>`. Props: `language`, `className` |
| `<List>` | Ordered/unordered list. Props: `ordered`, `className` |

### Hooks

| Hook | Description |
|------|-------------|
| `useDeck()` | Access deck state, dispatch, and configuration |
| `useSlide()` | Access current slide's h, v, active status, fragment index |
| `useOverview()` | Check if overview mode is active |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Right` / `Down` / `Space` / `Enter` | Next (fragment, then vertical, then horizontal) |
| `Left` / `Up` / `Backspace` | Previous |
| `Escape` | Toggle overview mode |
| `Home` | First slide |
| `End` | Last slide |
| `S` | Open speaker notes window |

## Try the Demo

```bash
git clone https://github.com/karthikbadam/mirion.git
cd mirion
npm install
npm run dev
```

Open `http://localhost:3000`. The demo uses a terminal aesthetic with custom CSS — an example of how Mirion stays out of your way while you design.

## Architecture

```
src/
├── components/     Deck, Slide, Fragment, Notes, Progress, SlideNumber, SpeakerView
├── layouts/        Center, Split, Stack
├── content/        Title, Code, List
├── core/           State machine (useReducer), context, types
├── hooks/          Navigation, hash sync, auto-scale, speaker channel
├── transitions/    CSS transitions and fragment animations
└── mirion.css      Structural styles only
```

State is managed by a `useReducer`-based state machine. Slides register themselves on mount — no child introspection needed, so slides work inside wrapper components.

## Publish to npm

```bash
# One-time login
npm login

# Build the library
npm run build

# Publish
npm publish --access public
```

To bump the version before publishing:

```bash
npm version patch   # or minor / major
npm run build
npm publish --access public
```

## Deploy Demo

```bash
npm run build:demo
# Deploy demo/dist to your hosting (GitHub Pages, Vercel, etc.)
```

## License

MIT
