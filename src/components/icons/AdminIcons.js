// Custom icon family for the admin dashboard's stat cards (and, now, a few
// other spots using the same concepts elsewhere in the app). Every shape
// uses stroke="currentColor" (the accent dot uses fill="currentColor") —
// nothing hardcodes a color, so either wrapping an icon in a container with
// `color: var(--accent)`, or passing `style={{ color: 'var(--accent)' }}`
// directly to the icon, makes it follow the site's accent setting live.
//
// Shared signature across the set: 1.6px rounded stroke, and a small filled
// dot in the same top-right spot on every icon.

const commonProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function UsersIcon({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} className={className} style={style} {...commonProps} aria-hidden="true">
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" />
      <path d="M15.2 8.2a2.6 2.6 0 1 0 0-3.4" opacity="0.55" />
      <path d="M16 13.3c2 .4 3.5 2.1 3.5 4.7" opacity="0.55" />
      <circle cx="19" cy="5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AdminShieldIcon({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} className={className} style={style} {...commonProps} aria-hidden="true">
      <path d="M12 3.5l6.5 2.6v5c0 4.6-2.7 7.8-6.5 9.4-3.8-1.6-6.5-4.8-6.5-9.4v-5L12 3.5z" />
      <path d="M9 12.2l2 2 4-4.2" />
      <circle cx="19" cy="5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FilesIcon({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} className={className} style={style} {...commonProps} aria-hidden="true">
      <path d="M6 4.5h6.5l4 4v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
      <path d="M12.5 4.5v4h4" />
      <path d="M8 13h6M8 16.5h4" opacity="0.55" />
      <circle cx="19" cy="5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FlashcardsIcon({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} className={className} style={style} {...commonProps} aria-hidden="true">
      <rect x="5.5" y="6.5" width="14" height="10" rx="2" opacity="0.55" />
      <rect x="3.5" y="8.5" width="14" height="10" rx="2" />
      <path d="M3.5 13.5h14" />
      <circle cx="19" cy="5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
