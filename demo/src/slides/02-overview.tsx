import { Slide, Stack } from "mirion";

export default function Overview() {
  return (
    <Slide>
      <Slide.Vertical>
        <Stack gap="2rem" justify="center">
          <h2 className="demo-heading">What is Mirion?</h2>
          <p className="demo-text-lg">
            A presentation framework built for developers who think in code, not
            slides.
          </p>
          <p className="demo-text">
            Powered by React and CSS transforms — bring your own design system.
            Use Chakra UI, Tailwind, or plain CSS to style your content.
          </p>
        </Stack>
      </Slide.Vertical>
      <Slide.Vertical>
        <Stack gap="2rem" justify="center">
          <h2 className="demo-heading">Why?</h2>
          <p className="demo-text-lg">
            Because PowerPoint is where ideas go to die.
          </p>
          <p className="demo-text">
            Every slide is a React component. Use any library, any
            visualization, any interactive element you want.
          </p>
        </Stack>
      </Slide.Vertical>
    </Slide>
  );
}
