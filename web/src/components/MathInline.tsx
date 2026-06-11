import katex from "katex";
import "katex/dist/katex.min.css";

interface Props {
  children: string;
  className?: string;
}

export function MathInline({ children, className = "" }: Props) {
  const html = katex.renderToString(children, {
    displayMode: false,
    throwOnError: false,
  });

  return (
    <span
      className={`math-inline leading-normal ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
