import { Deck, SpeakerView } from "@kvis/mirion";
import Intro from "./slides/01-intro";
import Overview from "./slides/02-overview";
import Architecture from "./slides/03-architecture";
import Demo from "./slides/04-demo";
import End from "./slides/05-end";

export default function App() {
  // Speaker notes popup
  if (window.location.search.includes("speaker")) {
    return <SpeakerView />;
  }

  return (
    <Deck
      transition="fade"
      background="var(--term-bg)"
      color="var(--term-fg)"
    >
      <Intro />
      <Overview />
      <Architecture />
      <Demo />
      <End />
    </Deck>
  );
}
