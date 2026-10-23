import React from "react";

interface BugBunnyLogoProps {
  className?: string;
  size?: number;
}

export function BugBunnyLogo({ className = "h-5 w-5", size = 20 }: BugBunnyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BugBunny Logo"
    >
      {/* Left Ear - shaped like code bracket < */}
      <path
        d="M8 3L13 14H10L6 5L8 3Z"
        fill="#34d399"
        fillOpacity="0.85"
      />
      <path
        d="M7 6L11 14H9L5 7L7 6Z"
        fill="#10b981"
      />
      
      {/* Right Ear - shaped like code bracket > */}
      <path
        d="M24 3L19 14H22L26 5L24 3Z"
        fill="#34d399"
        fillOpacity="0.85"
      />
      <path
        d="M25 6L21 14H23L27 7L25 6Z"
        fill="#10b981"
      />

      {/* Head polygon & cyber face */}
      <polygon
        points="16,11 23,17 21,26 16,29 11,26 9,17"
        fill="#14171f"
        stroke="#34d399"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Center Circuit / Bug Core */}
      <polygon
        points="16,16 19,20 16,24 13,20"
        fill="#059669"
      />

      {/* Stylized Cyber Eyes */}
      <polygon points="12,18 14,19 12,20" fill="#a7f3d0" />
      <polygon points="20,18 18,19 20,20" fill="#a7f3d0" />

      {/* Antennas / Nose whiskers accent */}
      <line x1="8" y1="21" x2="11" y2="22" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />
      <line x1="24" y1="21" x2="21" y2="22" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />
      <line x1="7" y1="24" x2="11" y2="24" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="25" y1="24" x2="21" y2="24" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

      {/* Chin vertex dot */}
      <circle cx="16" cy="27" r="1" fill="#34d399" />
    </svg>
  );
}
