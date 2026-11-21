type P = { size?: number; className?: string };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const MenuIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const SearchIcon = ({ size = 16, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const HeartIcon = ({
  size = 18,
  className,
  filled = false,
}: P & { filled?: boolean }) => (
  <svg
    {...base(size, className)}
    strokeWidth={1.8}
    fill={filled ? "currentColor" : "none"}
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const CartIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
);

export const UserIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const TruckIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <rect x="1" y="3" width="15" height="13" />
    <path d="M16 8h4l3 3v5h-7z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

export const CardIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h3" />
  </svg>
);

export const ReturnIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <path d="M1 4v6h6" />
    <path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" />
  </svg>
);

export const HeadsetIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" />
  </svg>
);

export const BagIcon = ({ size = 30, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.6}>
    <path d="M6 7h12l1 14H5z" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
  </svg>
);

export const InfoIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const FilterIcon = ({ size = 16, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const XIcon = ({ size = 16, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const PinIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const LockIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const CheckIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.5}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const BoxIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
    <path d="m3.3 7 8.7 5 8.7-5M12 12v9" />
  </svg>
);

export const LogoutIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);


