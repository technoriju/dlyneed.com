type P = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const MenuIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const SearchIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const HeartIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const CartIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
);

export const UserIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const TruckIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={1.7}>
    <rect x="1" y="3" width="15" height="13" />
    <path d="M16 8h4l3 3v5h-7z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

export const CardIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={1.7}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h3" />
  </svg>
);

export const ReturnIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={1.7}>
    <path d="M1 4v6h6" />
    <path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" />
  </svg>
);

export const HeadsetIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={1.7}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" />
  </svg>
);
