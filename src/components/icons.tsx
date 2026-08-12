import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * Set de íconos de línea propio (sin dependencias externas). Heredan el color
 * con `currentColor` y el tamaño por className.
 */
export const icons = {
  home: (p: IconProps) => (
    <Svg className={p.className}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
    </Svg>
  ),
  paw: (p: IconProps) => (
    <Svg className={p.className}>
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="9.5" cy="7.8" r="1.6" />
      <circle cx="14.5" cy="7.8" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
      <ellipse cx="12" cy="16.4" rx="3.4" ry="3" />
    </Svg>
  ),
  calendar: (p: IconProps) => (
    <Svg className={p.className}>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M3 9.5h18M8 3v3M16 3v3" />
    </Svg>
  ),
  droplet: (p: IconProps) => (
    <Svg className={p.className}>
      <path d="M12 3.5s6 5.4 6 9.5a6 6 0 0 1-12 0c0-4.1 6-9.5 6-9.5Z" />
    </Svg>
  ),
  route: (p: IconProps) => (
    <Svg className={p.className}>
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <path d="M8.2 19H14a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h1.8" />
    </Svg>
  ),
  card: (p: IconProps) => (
    <Svg className={p.className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
    </Svg>
  ),
  grid: (p: IconProps) => (
    <Svg className={p.className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Svg>
  ),
  users: (p: IconProps) => (
    <Svg className={p.className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
      <path d="M20.5 20a5.5 5.5 0 0 0-3.5-5.1" />
    </Svg>
  ),
  user: (p: IconProps) => (
    <Svg className={p.className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Svg>
  ),
  tag: (p: IconProps) => (
    <Svg className={p.className}>
      <path d="M11.6 3H4a1 1 0 0 0-1 1v7.6a1 1 0 0 0 .3.7l8.4 8.4a1 1 0 0 0 1.4 0l7.6-7.6a1 1 0 0 0 0-1.4L12.3 3.3a1 1 0 0 0-.7-.3Z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </Svg>
  ),
  star: (p: IconProps) => (
    <Svg className={p.className}>
      <path d="m12 3.5 2.5 5.3 5.8.8-4.2 4 1 5.7L12 16.6 6.9 19.3l1-5.7-4.2-4 5.8-.8L12 3.5Z" />
    </Svg>
  ),
  bell: (p: IconProps) => (
    <Svg className={p.className}>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 5.5 1.8 5.5H4.2S6 14 6 9.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Svg>
  ),
  pin: (p: IconProps) => (
    <Svg className={p.className}>
      <path d="M12 21s6.5-5.6 6.5-11A6.5 6.5 0 0 0 5.5 10C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.4" />
    </Svg>
  ),
  camera: (p: IconProps) => (
    <Svg className={p.className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7 9.4 4.5h5.2L16 7" />
      <circle cx="12" cy="13.5" r="3.4" />
    </Svg>
  ),
  plus: (p: IconProps) => (
    <Svg className={p.className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
} as const;

export type IconName = keyof typeof icons;
