import type { CSSProperties, ReactNode } from "react";
import { PLOT_FRAME_CLASS } from "../../lib/chartTheme";

interface Props {
  children: ReactNode;
  className?: string;
  height?: number | string;
  style?: CSSProperties;
}

export function ChartFrame({ children, className = "", height, style }: Props) {
  return (
    <div
      className={`${PLOT_FRAME_CLASS} ${className}`.trim()}
      style={{ ...(height != null ? { height } : {}), ...style }}
    >
      {children}
    </div>
  );
}
