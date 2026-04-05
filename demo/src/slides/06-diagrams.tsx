import { Slide, Diagram, Center } from "@kvis/mirion";

/** Simple diagram showing off the core features. */
export function DiagramSimple() {
  return (
    <Slide>
      <Center>
        <h2 className="demo-heading" style={{ marginBottom: "1rem" }}>
          Diagram Component
        </h2>
        <Diagram width={700} height={350}>
          <Diagram.Group
            id="inputs"
            x={0}
            y={0}
            width={200}
            height={280}
            label="INPUTS"
          />
          <Diagram.Group
            id="processing"
            x={250}
            y={0}
            width={200}
            height={280}
            label="PROCESSING"
          />
          <Diagram.Group
            id="output"
            x={500}
            y={0}
            width={180}
            height={280}
            label="OUTPUT"
          />

          <Diagram.Node id="api" group="inputs" x={20} y={40} color="blue">
            API
          </Diagram.Node>
          <Diagram.Node
            id="files"
            group="inputs"
            x={20}
            y={130}
            color="blue"
            subtitle="CSV, JSON"
          >
            Files
          </Diagram.Node>

          <Diagram.Node
            id="transform"
            group="processing"
            x={20}
            y={40}
            color="purple"
            subtitle="Clean & validate"
          >
            Transform
          </Diagram.Node>
          <Diagram.Node
            id="enrich"
            group="processing"
            x={20}
            y={130}
            color="purple"
            subtitle="Add metadata"
          >
            Enrich
          </Diagram.Node>

          <Diagram.Node
            id="db"
            group="output"
            x={10}
            y={80}
            color="green"
            subtitle="PostgreSQL"
          >
            Database
          </Diagram.Node>

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
        <Diagram width={960} height={480}>
          {/* Groups */}
          <Diagram.Group
            id="ingest"
            x={0}
            y={0}
            width={250}
            height={370}
            label="DATA INGEST"
          />
          <Diagram.Group
            id="engine"
            x={290}
            y={0}
            width={250}
            height={370}
            label="LLM ENGINE"
          />
          <Diagram.Group
            id="store"
            x={580}
            y={0}
            width={250}
            height={200}
            label="KNOWLEDGE STORE"
          />
          <Diagram.Group
            id="outputs"
            x={0}
            y={400}
            width={580}
            height={70}
            label="OUTPUTS"
          />

          {/* Data Ingest nodes */}
          <Diagram.Node
            id="sources"
            group="ingest"
            x={20}
            y={40}
            color="red"
            subtitle="Articles, Papers, Repos"
          >
            Sources
          </Diagram.Node>
          <Diagram.Node
            id="raw"
            group="ingest"
            x={20}
            y={150}
            color="green"
            subtitle="Source docs"
          >
            raw/
          </Diagram.Node>
          <Diagram.Node
            id="search"
            group="ingest"
            x={20}
            y={260}
            color="green"
            subtitle="Web UI + CLI"
          >
            Search
          </Diagram.Node>

          {/* LLM Engine nodes */}
          <Diagram.Node
            id="compile"
            group="engine"
            x={20}
            y={40}
            color="blue"
            subtitle="raw → wiki"
          >
            Compile
          </Diagram.Node>
          <Diagram.Node
            id="qa"
            group="engine"
            x={20}
            y={120}
            color="blue"
            subtitle="Research answers"
          >
            Q&A
          </Diagram.Node>
          <Diagram.Node
            id="linting"
            group="engine"
            x={20}
            y={200}
            color="purple"
            subtitle="Health checks"
          >
            Linting
          </Diagram.Node>
          <Diagram.Node
            id="indexing"
            group="engine"
            x={20}
            y={280}
            color="green"
            subtitle="Summaries, links"
          >
            Indexing
          </Diagram.Node>

          {/* Knowledge Store */}
          <Diagram.Node
            id="wiki"
            group="store"
            x={20}
            y={40}
            width={200}
            color="green"
            subtitle="~100 articles, ~400K words"
          >
            Wiki (.md)
          </Diagram.Node>

          {/* Outputs */}
          <Diagram.Node id="markdown" group="outputs" x={10} y={10} color="olive">
            Markdown
          </Diagram.Node>
          <Diagram.Node id="slides" group="outputs" x={190} y={10} color="olive">
            Slides
          </Diagram.Node>
          <Diagram.Node id="charts" group="outputs" x={370} y={10} color="olive">
            Charts
          </Diagram.Node>

          {/* Edges */}
          <Diagram.Edge from="sources" to="raw" />
          <Diagram.Edge from="raw" to="compile" />
          <Diagram.Edge from="raw" to="qa" />
          <Diagram.Edge from="raw" to="linting" />
          <Diagram.Edge from="raw" to="indexing" />
          <Diagram.Edge from="compile" to="wiki" />
          <Diagram.Edge from="qa" to="wiki" />
          <Diagram.Edge from="linting" to="wiki" />
          <Diagram.Edge from="indexing" to="wiki" />
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
