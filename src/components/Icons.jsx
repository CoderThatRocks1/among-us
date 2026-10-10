export function Icon({ name, size = 20, strokeWidth = 1.8, ...props }) {
  const paths = {
    play: (
      <>
        <path d="m8 5 11 7-11 7V5Z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </>
    ),
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    wifi: (
      <>
        <path d="M2 8a16 16 0 0 1 20 0M5 11a11 11 0 0 1 14 0m-11 3a6 6 0 0 1 8 0m-4 5h.01" />
      </>
    ),
    bolt: (
      <>
        <path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    volume: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4V5ZM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3ZM12 9v4m0 4h.01" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    keyboard: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 16h8" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export function Astronaut({ color = "#f8bc5d", size = 100, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 112 130"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="55" cy="121" rx="43" ry="6" fill="#030711" opacity=".38" />
      <rect
        x="7"
        y="54"
        width="23"
        height="46"
        rx="11"
        fill={color}
        stroke="#17233b"
        strokeWidth="5"
      />
      <path
        d="M28 36C28 18 40 9 56 9s29 10 29 27v64c0 7-6 11-13 11h-6v-23H47v23h-7c-7 0-12-4-12-11V36Z"
        fill={color}
        stroke="#17233b"
        strokeWidth="5"
      />
      <rect
        x="83"
        y="56"
        width="22"
        height="42"
        rx="9"
        fill={color}
        stroke="#17233b"
        strokeWidth="5"
      />
      <path
        d="M38 43c0-13 8-20 23-20h13c8 0 12 6 12 15v11c0 10-7 15-18 15H52c-9 0-14-8-14-17v-4Z"
        fill="#a8e8ee"
        stroke="#1c3549"
        strokeWidth="5"
      />
      <path
        d="M44 39c2-7 7-9 14-10"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".7"
      />
      <path
        d="M48 111v7c0 4-3 6-8 6H30c-5 0-8-3-8-7v-14M65 110v8c0 4 3 6 8 6h10c5 0 8-3 8-7v-14"
        fill={color}
        stroke="#17233b"
        strokeWidth="5"
      />
    </svg>
  );
}
