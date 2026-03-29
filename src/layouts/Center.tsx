import type { ReactNode, CSSProperties } from "react";

interface CenterProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Center({ children, className = "", style }: CenterProps) {
  return (
    <div
      className={`mirion-center ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
