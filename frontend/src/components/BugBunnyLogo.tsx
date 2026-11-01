import React from "react";

interface BugBunnyLogoProps {
  className?: string;
  size?: number;
  variant?: "lime" | "dark" | "monochrome";
}

/**
 * Geometric, faceted BugBunny brand mark.
 * Minimalist, developer-tool aesthetic inspired by low-poly / origami vector geometry.
 */
export function BugBunnyLogo({
  className = "h-5 w-5",
  size = 22,
  variant = "lime",
}: BugBunnyLogoProps) {
  const isDark = variant === "dark";
  const earLeftColor = isDark ? "#292D27" : "#C6F36B";
  const earRightColor = isDark ? "#171916" : "#AEE64E";
  const headColor = isDark ? "#171916" : "#292D27";
  const facetColor = isDark ? "#3A4037" : "#3D433A";
  const eyeColor = isDark ? "#C6F36B" : "#C6F36B";

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
      {/* Left Ear - faceted geometric polygon */}
      <polygon
        points="10,2 14,13 8,11 6,4"
        fill={earLeftColor}
      />
      <polygon
        points="10,2 8,11 6,4"
        fill="#B5E856"
        fillOpacity={variant === "dark" ? "0.2" : "0.7"}
      />

      {/* Right Ear - faceted geometric polygon */}
      <polygon
        points="22,2 26,4 24,11 18,13"
        fill={earRightColor}
      />
      <polygon
        points="22,2 24,11 26,4"
        fill="#9FD840"
        fillOpacity={variant === "dark" ? "0.3" : "0.8"}
      />

      {/* Main Angular Head */}
      <polygon
        points="8,11 16,9 24,11 26,20 16,29 6,20"
        fill={headColor}
      />

      {/* Geometric Facets / Light Reflection Plane */}
      <polygon
        points="16,9 24,11 20,20 16,21"
        fill={facetColor}
        fillOpacity="0.85"
      />
      <polygon
        points="16,9 16,21 12,20 8,11"
        fill={facetColor}
        fillOpacity="0.5"
      />

      {/* Chin Plane */}
      <polygon
        points="12,20 16,21 20,20 16,29"
        fill="#171916"
      />

      {/* Cybernetic Terminal Eye - Geometric Rhombus */}
      <polygon
        points="11,16 13,15 14,17 12,18"
        fill={eyeColor}
      />
      <polygon
        points="21,16 19,15 18,17 20,18"
        fill={eyeColor}
      />

      {/* Center Snout/Compass Point */}
      <circle cx="16" cy="22" r="1" fill={eyeColor} />
    </svg>
  );
}
