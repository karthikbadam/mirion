import { useEffect, useState, useRef } from "react";
import type { SpeakerMessage } from "../core/types";

/**
 * Speaker notes view — renders in a popup window.
 * Listens to BroadcastChannel for slide state from the main deck.
 *
 * Usage: Add to your app and conditionally render when ?speaker=true is in the URL.
 *
 * if (window.location.search.includes('speaker')) {
 *   return <SpeakerView />;
 * }
 */
export function SpeakerView() {
  const [data, setData] = useState<SpeakerMessage | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const channel = new BroadcastChannel("mirion-speaker");
    channel.onmessage = (e: MessageEvent<SpeakerMessage>) => {
      if (e.data.type === "mirion-state") {
        setData(e.data);
      }
    };
    return () => channel.close();
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "#1a1a2e",
        color: "#e0e0e0",
        minHeight: "100vh",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          borderBottom: "1px solid #333",
          paddingBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.2rem", opacity: 0.7 }}>
          Mirion Speaker Notes
        </h1>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", opacity: 0.6 }}>
            Slide {data ? data.h + 1 : "-"} / {data?.totalSlides ?? "-"}
          </span>
          <span
            style={{
              fontSize: "2rem",
              fontVariantNumeric: "tabular-nums",
              fontWeight: "bold",
            }}
          >
            {mins}:{secs}
          </span>
        </div>
      </div>

      <div>
        <h2
          style={{
            fontSize: "0.9rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.5,
            marginBottom: "1rem",
          }}
        >
          Notes
        </h2>
        <div
          style={{
            fontSize: "1.4rem",
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            padding: "1.5rem",
            background: "#16213e",
            borderRadius: "8px",
            minHeight: "200px",
          }}
        >
          {data?.notes || (
            <span style={{ opacity: 0.3 }}>No notes for this slide</span>
          )}
        </div>
      </div>

      {!data && (
        <div
          style={{
            marginTop: "3rem",
            textAlign: "center",
            opacity: 0.4,
          }}
        >
          Waiting for presentation...
        </div>
      )}
    </div>
  );
}
