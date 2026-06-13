/**
 * Monograma GA (Gestión Avícola): marco redondeado + Inter bold.
 */
export function ChickenLogo({ variant = 'nav', size = 32, className = '', title }) {
  const root = ['chicken-logo', variant && `chicken-logo--${variant}`, className].filter(Boolean).join(' ');
  const dim = Number(size) || 32;
  const label = title || 'Gestión Avícola';

  return (
    <svg
      className={root}
      width={dim}
      height={dim}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <rect className="ga-frame" x="2" y="2" width="44" height="44" rx="12" />
      <text
        className="ga-letters"
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily='Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
        fontSize="19"
        fontWeight="700"
        letterSpacing="-1.6"
      >
        GA
      </text>
    </svg>
  );
}

export default ChickenLogo;
