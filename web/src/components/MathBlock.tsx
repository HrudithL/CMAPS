import katex from "katex";
import "katex/dist/katex.min.css";

interface MathBlockProps {
  children: string;
  display?: boolean;
  className?: string;
}

export function MathBlock({ children, display = true, className = "" }: MathBlockProps) {
  const html = katex.renderToString(children, {
    displayMode: display,
    throwOnError: false,
  });

  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
