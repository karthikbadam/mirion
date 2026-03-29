import { Slide, Notes, Center } from "mirion";

export default function Demo() {
  return (
    <Slide transition="slide">
      <Notes>Switch to the live demo here</Notes>
      <Center>
        <p className="demo-label">01</p>
        <h2 className="demo-section-heading">DEMO</h2>
        <div className="demo-section-line" />
        <p className="demo-subheading">Live code walkthrough</p>
      </Center>
    </Slide>
  );
}
