import type { ReactNode, CSSProperties } from "react";

interface ListProps {
  children: ReactNode;
  ordered?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function List({
  children,
  ordered = false,
  className = "",
  style,
}: ListProps) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={`mirion-list ${className}`}
      style={{
        margin: 0,
        paddingLeft: "1.5em",
        lineHeight: 1.8,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
