import { Slide, Fragment, Stack, List } from "@kvis/mirion";

export default function Architecture() {
  return (
    <Slide>
      <Stack gap="2rem" justify="center">
        <h2 className="demo-heading">Architecture</h2>
        <p className="demo-text-lg">Three layers, cleanly separated:</p>
        <List className="demo-list">
          <Fragment animation="fade-up">
            <li>Layouts — spatial arrangement of slots on a slide</li>
          </Fragment>
          <Fragment animation="fade-up">
            <li>Content — typed helpers that fill those slots</li>
          </Fragment>
          <Fragment animation="fade-up">
            <li>Animations — orthogonal reveal and motion directives</li>
          </Fragment>
        </List>
      </Stack>
    </Slide>
  );
}
