#!/usr/bin/env node
import { cac } from "cac";
import pc from "picocolors";

const cli = cac("mirion");

cli
  .command("new <name>", "Scaffold a new story project")
  .option("--force", "Overwrite target directory if it exists")
  .action(async (_name: string, _opts: { force?: boolean }) => {
    console.error(pc.yellow("mirion new: not implemented yet (Phase 8)"));
    process.exit(2);
  });

cli
  .command("build <story>", "Bake a narrative + dataset into deck.json + deck.tsx")
  .option("--data <path>", "Path to dataset file (csv/parquet/json)")
  .option("--out <dir>", "Output directory", { default: "dist" })
  .option("--runtime <mode>", "Runtime mode: bake | duckdb", { default: "bake" })
  .option("--quiet", "Suppress non-error logs")
  .action(
    async (
      _story: string,
      _opts: { data?: string; out?: string; runtime?: string; quiet?: boolean },
    ) => {
      console.error(pc.yellow("mirion build: not implemented yet (Phase 2–5)"));
      process.exit(2);
    },
  );

cli
  .command("preview <story>", "Live preview of a narrative")
  .option("--data <path>", "Path to dataset file")
  .option("--port <n>", "Port to serve on", { default: 5180 })
  .option("--host <h>", "Host to bind")
  .option("--runtime <mode>", "Runtime mode: bake | duckdb", { default: "bake" })
  .action(
    async (
      _story: string,
      _opts: { data?: string; port?: number; host?: string; runtime?: string },
    ) => {
      console.error(pc.yellow("mirion preview: not implemented yet (Phase 7)"));
      process.exit(2);
    },
  );

cli.help();
cli.version("0.1.0");
cli.parse();
