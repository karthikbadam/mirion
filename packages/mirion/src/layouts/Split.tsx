import type { ReactNode, CSSProperties } from "react";

interface SplitProps {
  children: ReactNode;
  ratio?: string; // e.g., "1fr 1fr", "2fr 1fr"
  gap?: string;
  /** Stack columns vertically on mobile viewports (default: true) */
  stackOnMobile?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Split({
  children,
  ratio = "1fr 1fr",
  gap = "2rem",
  stackOnMobile = true,
  className = "",
  style,
}: SplitProps) {
  const classes = [
    "mirion-split",
    stackOnMobile && "mirion-split-stack-mobile",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
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
