import { useState, useEffect, type ReactNode, type CSSProperties } from "react";

interface SplitProps {
  children: ReactNode;
  ratio?: string; // e.g., "1fr 1fr", "2fr 1fr"
  gap?: string;
  /** @deprecated Use `stackBelow` instead */
  stackOnMobile?: boolean;
  /** Breakpoint width (px) below which columns stack vertically. Set to `false` to never stack. Default: 768 */
  stackBelow?: number | false;
  className?: string;
  style?: CSSProperties;
}

export function Split({
  children,
  ratio = "1fr 1fr",
  gap = "2rem",
  stackOnMobile,
  stackBelow: stackBelowProp,
  className = "",
  style,
}: SplitProps) {
  // Resolve the effective breakpoint:
  // - If stackBelow is explicitly set, use it
  // - Else fall back to stackOnMobile (true => 768, false => false)
  // - Default: 768
  const stackBelow =
    stackBelowProp !== undefined
      ? stackBelowProp
      : stackOnMobile !== undefined
        ? stackOnMobile
          ? 768
          : false
        : 768;

  // For the default 768px, use the CSS class (handled by media query in mirion.css).
  // For custom values, use a runtime width check.
  const customBreakpoint =
    typeof stackBelow === "number" && stackBelow !== 768 ? stackBelow : null;

  const [isStacked, setIsStacked] = useState(() => {
    if (customBreakpoint === null) return false;
    return typeof window !== "undefined" ? window.innerWidth <= customBreakpoint : false;
  });

  useEffect(() => {
    if (customBreakpoint === null) return;
    const check = () => setIsStacked(window.innerWidth <= customBreakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [customBreakpoint]);

  const useCssClass = stackBelow === 768;

  const classes = [
    "mirion-split",
    useCssClass && "mirion-split-stack-mobile",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{
        display: "grid",
        gridTemplateColumns: isStacked ? "1fr" : ratio,
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
