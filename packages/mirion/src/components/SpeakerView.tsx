import { useEffect, useState, useRef } from "react";
import type { CSSProperties } from "react";
import type { SpeakerMessage } from "../core/types";

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

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
interface SpeakerViewProps {
  className?: string;
  style?: CSSProperties;
}

export function SpeakerView({ className = "", style }: SpeakerViewProps) {
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

  const mobile = useIsMobile();

  const mins = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div
      className={`mirion-speaker ${className}`}
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "#1a1a2e",
        color: "#e0e0e0",
        minHeight: "100vh",
        padding: mobile ? "1rem" : "2rem",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: mobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: mobile ? "flex-start" : "center",
          gap: mobile ? "0.75rem" : undefined,
          marginBottom: mobile ? "1rem" : "2rem",
          borderBottom: "1px solid #333",
          paddingBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: mobile ? "1rem" : "1.2rem", opacity: 0.7 }}>
          Mirion Speaker Notes
        </h1>
        <div style={{ display: "flex", gap: mobile ? "1rem" : "2rem", alignItems: "center" }}>
          <span style={{ fontSize: mobile ? "0.9rem" : "1rem", opacity: 0.6 }}>
            Slide {data ? data.h + 1 : "-"} / {data?.totalSlides ?? "-"}
          </span>
          <span
            style={{
              fontSize: mobile ? "1.5rem" : "2rem",
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
            fontSize: mobile ? "1.1rem" : "1.4rem",
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            padding: mobile ? "1rem" : "1.5rem",
            background: "#16213e",
            borderRadius: "8px",
            minHeight: mobile ? "120px" : "200px",
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
            marginTop: mobile ? "2rem" : "3rem",
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
