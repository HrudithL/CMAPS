/** Animated mini chart: price vs MA with highlighted analog days. */
export function AnalogMatchDemo() {
  return (
    <svg
      viewBox="0 0 400 220"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1="40"
          y1={40 + i * 36}
          x2="380"
          y2={40 + i * 36}
          stroke="#23252a"
          strokeWidth="1"
        />
      ))}

      {/* MA dashed */}
      <path
        d="M 40 130 Q 120 125, 180 115 T 300 95 T 380 80"
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.7"
      />

      {/* Price area */}
      <path
        d="M 40 150 Q 100 140, 140 120 T 220 100 T 300 110 T 380 70 L 380 200 L 40 200 Z"
        fill="url(#priceGrad)"
      />
      <path
        d="M 40 150 Q 100 140, 140 120 T 220 100 T 300 110 T 380 70"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2.5"
      />

      {/* Analog match dots */}
      {[
        [120, 128],
        [195, 108],
        [265, 112],
        [340, 88],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="14" fill="#f59e0b" opacity="0.15" />
          <circle cx={cx} cy={cy} r="5" fill="#f59e0b" />
        </g>
      ))}

      {/* Today marker */}
      <circle cx="380" cy="70" r="7" fill="#f7f8f8" stroke="#f59e0b" strokeWidth="2" />
      <text x="360" y="58" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono">
        today
      </text>

      {/* Labels */}
      <text x="40" y="28" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono">
        price
      </text>
      <text x="300" y="75" fill="#6366f1" fontSize="10" fontFamily="JetBrains Mono" opacity="0.8">
        MA(H)
      </text>
    </svg>
  );
}
