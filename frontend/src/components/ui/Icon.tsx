import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  drop: <path d="M12 3c3.2 4.1 6 7.3 6 10.2A6 6 0 0 1 6 13.2C6 10.3 8.8 7.1 12 3Z" />,
  sprout: <path d="M12 21v-8m0 0c0-4 3-7 8-7 0 4-3 7-8 7Zm0 0c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" />,
  gauge: <path d="M5 19a9 9 0 1 1 14 0M12 13l4-5" />,
  bell: <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6m4 9a2 2 0 0 0 4 0" />,
  map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  sensor: <path d="M4 14a8 8 0 0 1 16 0M7 14a5 5 0 0 1 10 0m-7.5 0h5" />,
  cloud: <path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 9a4 4 0 0 1 0 8H7Z" />,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" /></>,
  table: <path d="M4 5h16v14H4zM4 10h16M10 10v9" />,
  check: <path d="m5 13 4 4L19 7" />,
  flask: <path d="M9 3h6M10 3v6l-6 10a1.3 1.3 0 0 0 1.2 2h13.6A1.3 1.3 0 0 0 20 19L14 9V3M8 14h8" />,
  home: <path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9" />,
  clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  alert: <path d="M12 4 2 20h20L12 4Zm0 7v4m0 3v.5" />,
  info: <path d="M12 8v.5m0 3v6m9-6a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  calendar: <path d="M5 6h14v14H5zM5 10h14M9 3v4m6-4v4" />,
  pin: <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  share: <path d="M12 15V4m0 0 4 4m-4-4L8 8m8 4v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />,
  temp: <path d="M10 4a2 2 0 1 1 4 0v9.3a4.5 4.5 0 1 1-4 0V4Z" />,
  logout: <path d="M9 4H5v16h4m4-12 4 4-4 4m4-4H9" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 17l9 5 9-5" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  dots: <path d="M5 12h.5m5 0h.5m5 0h.5" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />,
  edit: <path d="M4 20h4L20 8l-4-4L4 16v4Zm11-13 4 4" />,
  eye: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  eyeOff: <path d="M4 4l16 16M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6 7A16 16 0 0 0 2 12s3.5 7 10 7c1.5 0 2.8-.3 4-.8M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  mail: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  lock: <path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" />,
};

export function Icon({ name, size = 18 }: { name: string; size?: number }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}
