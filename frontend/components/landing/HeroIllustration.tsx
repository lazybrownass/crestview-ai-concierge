// No stock photography exists for a fictional developer, so the hero is a
// custom SVG facade-and-canal-reflection illustration instead of a borrowed
// or invented photo URL — see docs/design-plan.md. Pure inline SVG: zero
// image bytes, zero JS, crisp at any viewport.

function FacadeGrid({
  y,
  opacity,
  litSeed,
}: {
  y: number;
  opacity: number;
  litSeed: number;
}) {
  const cols = 14;
  const rows = 6;
  const cellW = 60;
  const cellH = 34;
  const windows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = (c * 7 + r * 13 + litSeed) % 11 === 0;
      windows.push(
        <rect
          key={`${r}-${c}`}
          x={c * cellW + 6}
          y={y + r * cellH + 6}
          width={cellW - 12}
          height={cellH - 12}
          fill={lit ? "var(--color-brass-400)" : "var(--color-green-950)"}
          opacity={lit ? 0.85 : opacity}
        />,
      );
    }
  }
  return <>{windows}</>;
}

export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 840 460"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="Illustration of the Crestview Residences towers at dusk, reflected in the canal below"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1a13" />
          <stop offset="55%" stopColor="var(--color-green-950)" />
          <stop offset="100%" stopColor="var(--color-green-900)" />
        </linearGradient>
        <linearGradient id="reflection" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-green-900)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-green-950)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="840" height="460" fill="url(#sky)" />

      <g transform="translate(60,120)">
        <rect width="828" height="220" fill="var(--color-green-800)" opacity="0.4" />
        <FacadeGrid y={0} opacity={0.15} litSeed={2} />
      </g>

      <g transform="translate(180,90)">
        <rect width="480" height="260" fill="var(--color-green-900)" />
        <FacadeGrid y={0} opacity={0.2} litSeed={5} />
      </g>

      <g transform="translate(340,340) scale(1,-1)" opacity="0.5">
        <rect width="480" height="130" fill="url(#reflection)" transform="translate(-160,0)" />
      </g>

      <rect x="0" y="340" width="840" height="120" fill="var(--color-green-950)" opacity="0.9" />
    </svg>
  );
}
