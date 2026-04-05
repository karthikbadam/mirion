import { Slide, Diagram, Center } from "@kvis/mirion";

/** Simple diagram showing off the core features. */
export function DiagramSimple() {
  return (
    <Slide>
      <Center>
        <h2 className="demo-heading" style={{ marginBottom: "1rem" }}>
          Diagram Component
        </h2>
        <Diagram>
          <Diagram.Group id="inputs" label="INPUTS">
            <Diagram.Node id="api" color="blue">API</Diagram.Node>
            <Diagram.Node id="files" color="blue" subtitle="CSV, JSON">
              Files
            </Diagram.Node>
          </Diagram.Group>

          <Diagram.Group id="processing" label="PROCESSING">
            <Diagram.Node
              id="transform"
              color="purple"
              subtitle="Clean & validate"
            >
              Transform
            </Diagram.Node>
            <Diagram.Node id="enrich" color="purple" subtitle="Add metadata">
              Enrich
            </Diagram.Node>
          </Diagram.Group>

          <Diagram.Group id="output" label="OUTPUT">
            <Diagram.Node id="db" color="green" subtitle="PostgreSQL">
              Database
            </Diagram.Node>
          </Diagram.Group>

          <Diagram.Edge from="api" to="transform" />
          <Diagram.Edge from="files" to="enrich" />
          <Diagram.Edge from="transform" to="db" label="validated" />
          <Diagram.Edge from="enrich" to="db" label="enriched" />
        </Diagram>
      </Center>
    </Slide>
  );
}

/** Full recreation of the reference architecture diagram. */
export function DiagramReference() {
  return (
    <Slide>
      <Center>
        <h2 className="demo-heading" style={{ marginBottom: "0.5rem" }}>
          Knowledge System Architecture
        </h2>
        <Diagram>
          <Diagram.Group id="ingest" label="DATA INGEST">
            <Diagram.Node
              id="sources"
              color="red"
              subtitle="Articles, Papers, Repos"
            >
              Sources
            </Diagram.Node>
            <Diagram.Node id="raw" color="green" subtitle="Source docs">
              raw/
            </Diagram.Node>
            <Diagram.Node id="search" color="green" subtitle="Web UI + CLI">
              Search
            </Diagram.Node>
          </Diagram.Group>

          <Diagram.Group id="engine" label="LLM ENGINE">
            <Diagram.Node id="compile" color="blue" subtitle="raw → wiki">
              Compile
            </Diagram.Node>
            <Diagram.Node id="qa" color="blue" subtitle="Research answers">
              Q&A
            </Diagram.Node>
            <Diagram.Node id="linting" color="purple" subtitle="Health checks">
              Linting
            </Diagram.Node>
          </Diagram.Group>

          <Diagram.Group id="store" label="KNOWLEDGE STORE">
            <Diagram.Node
              id="wiki"
              color="green"
              subtitle="~100 articles, ~400K words"
            >
              Wiki (.md)
            </Diagram.Node>
          </Diagram.Group>

          <Diagram.Edge from="sources" to="raw" />
          <Diagram.Edge from="raw" to="compile" />
          <Diagram.Edge from="raw" to="qa" />
          <Diagram.Edge from="raw" to="linting" />
          <Diagram.Edge from="compile" to="wiki" />
          <Diagram.Edge from="qa" to="wiki" />
          <Diagram.Edge from="linting" to="wiki" />
        </Diagram>
      </Center>
    </Slide>
  );
}

export default function DiagramSlides() {
  return (
    <>
      <DiagramSimple />
      <DiagramReference />
    </>
  );
}
