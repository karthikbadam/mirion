import type { ReactNode, CSSProperties } from "react";

interface TitleProps {
  children: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  style?: CSSProperties;
  subtitleStyle?: CSSProperties;
}

export function Title({
  children,
  subtitle,
  className = "",
  style,
  subtitleStyle,
}: TitleProps) {
  return (
    <div
      className={`mirion-title ${className}`}
      style={{ textAlign: "center", ...style }}
    >
      <h1 style={{ margin: 0 }}>{children}</h1>
      {subtitle && (
        <p style={{ margin: "0.5em 0 0", opacity: 0.7, ...subtitleStyle }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
