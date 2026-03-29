import type { ReactNode, CSSProperties } from "react";

interface SplitProps {
  children: ReactNode;
  ratio?: string; // e.g., "1fr 1fr", "2fr 1fr"
  gap?: string;
  className?: string;
  style?: CSSProperties;
}

export function Split({
  children,
  ratio = "1fr 1fr",
  gap = "2rem",
  className = "",
  style,
}: SplitProps) {
  return (
    <div
      className={`mirion-split ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: ratio,
        gap,
        width: "100%",
        height: "100%",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
