import katex from "katex";
import { useLayoutEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";

const MIN_FONT_EM = 0.55;
const FONT_STEP = 0.04;

interface MathBlockProps {
  children: string;
  stacked?: string;
  display?: boolean;
  className?: string;
  fit?: boolean;
}

function renderLatex(latex: string, display: boolean) {
  return katex.renderToString(latex, {
    displayMode: display,
    throwOnError: false,
  });
}

export function MathBlock({
  children,
  stacked,
  display = true,
  className = "",
  fit = false,
}: MathBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fontEm, setFontEm] = useState(1);
  const [useStacked, setUseStacked] = useState(false);

  const latex = useStacked && stacked ? stacked : children;
  const html = renderLatex(latex, display);

  useLayoutEffect(() => {
    if (!fit) {
      setFontEm(1);
      setUseStacked(false);
      return;
    }

    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const applyFit = () => {
      const measure = (stackedMode: boolean) => {
        const content = stackedMode && stacked ? stacked : children;
        inner.innerHTML = renderLatex(content, display);
        inner.style.fontSize = "1em";

        let size = 1;
        while (size > MIN_FONT_EM && inner.scrollWidth > container.clientWidth) {
          size -= FONT_STEP;
          inner.style.fontSize = `${size}em`;
        }

        return {
          size,
          fits: inner.scrollWidth <= container.clientWidth,
        };
      };

      const compact = measure(false);
      if (compact.fits) {
        setUseStacked(false);
        setFontEm(compact.size);
        inner.innerHTML = renderLatex(children, display);
        inner.style.fontSize = `${compact.size}em`;
        return;
      }

      if (stacked) {
        const stackedResult = measure(true);
        setUseStacked(true);
        setFontEm(stackedResult.size);
        inner.innerHTML = renderLatex(stacked, display);
        inner.style.fontSize = `${stackedResult.size}em`;
        return;
      }

      setUseStacked(false);
      setFontEm(compact.size);
      inner.innerHTML = renderLatex(children, display);
      inner.style.fontSize = `${compact.size}em`;
    };

    applyFit();
    const observer = new ResizeObserver(applyFit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children, stacked, display, fit]);

  if (!fit) {
    return (
      <div className={className}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`math-fit-container ${className}`.trim()}>
      <div
        ref={innerRef}
        className="math-fit-inner"
        style={{ fontSize: `${fontEm}em` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
