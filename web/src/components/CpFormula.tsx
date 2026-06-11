import { MathInline } from "./MathInline";

interface Props {
  side: "long" | "short";
  cp: number;
  hits: number;
  occurrences: number;
  className?: string;
}

export function CpFormula({ side, cp, hits, occurrences, className = "" }: Props) {
  if (occurrences === 0) {
    return <span className="text-slate-400">—</span>;
  }

  const tag = side === "long" ? "long" : "short";
  const pct = (cp * 100).toFixed(1);
  const latex = String.raw`${pct}\text{\%}\;\Bigl(\frac{\left|A_{\text{${tag}}}\right|}{\left|B_{\text{${tag}}}\right|}=\frac{${hits}}{${occurrences}}\Bigr)`;

  return <MathInline className={className}>{latex}</MathInline>;
}
