import type { ReactNode, CSSProperties } from "react";

interface StackProps {
  children: ReactNode;
  gap?: string;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  className?: string;
  style?: CSSProperties;
}

export function Stack({
  children,
  gap = "1.5rem",
  align = "stretch",
  justify = "center",
  className = "",
  style,
}: StackProps) {
  return (
    <div
      className={`mirion-stack ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        alignItems: align,
        justifyContent: justify,
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
