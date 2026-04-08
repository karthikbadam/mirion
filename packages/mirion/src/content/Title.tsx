import type { ReactNode, CSSProperties } from "react";

interface TitleProps {
  children: ReactNode;
  subtitle?: ReactNode;
  supertitle?: ReactNode;
  className?: string;
  style?: CSSProperties;
  subtitleStyle?: CSSProperties;
  supertitleStyle?: CSSProperties;
}

export function Title({
  children,
  subtitle,
  supertitle,
  className = "",
  style,
  subtitleStyle,
  supertitleStyle,
}: TitleProps) {
  return (
    <div
      className={`mirion-title ${className}`}
      style={{ textAlign: "center", ...style }}
    >
      {supertitle && (
        <p style={{ margin: "0 0 0.5em", opacity: 0.7, fontSize: "0.85em", textTransform: "uppercase", letterSpacing: "0.05em", ...supertitleStyle }}>
          {supertitle}
        </p>
      )}
      <h1 style={{ margin: 0 }}>{children}</h1>
      {subtitle && (
        <p style={{ margin: "0.5em 0 0", opacity: 0.7, ...subtitleStyle }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
