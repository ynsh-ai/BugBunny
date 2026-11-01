import React from "react";

export function BugBunnyGraphicPanel() {
  return (
    <div className="relative h-full w-full min-h-[600px] overflow-hidden bg-[#1E2029] flex items-center justify-center select-none border-l border-[#2D313D]">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,136,217,0.12),transparent_70%)]" />

      {/* Vertical Helical Mesh Cylinder */}
      <div className="relative w-[340px] h-[92%] flex items-center justify-center">
        <svg
          viewBox="0 0 340 900"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Helical Gradient 1 */}
            <linearGradient id="helixPink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9BAE" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#FC6D85" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFC2D1" stopOpacity="0.65" />
            </linearGradient>

            {/* Helical Gradient 2 (Bunny Lime & Cyan) */}
            <linearGradient id="helixLime" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C6F36B" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#6388D9" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#C6F36B" stopOpacity="0.7" />
            </linearGradient>

            {/* Geodesic Sphere Grid */}
            <pattern id="geoMesh" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M8 0L16 8L8 16L0 8Z" stroke="#7BA2F7" strokeWidth="0.75" fill="none" strokeOpacity="0.4" />
              <circle cx="8" cy="8" r="1" fill="#C6F36B" />
            </pattern>
          </defs>

          {/* Cylinder Boundary Vertical Lines */}
          <line x1="30" y1="0" x2="30" y2="900" stroke="#484E61" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
          <line x1="310" y1="0" x2="310" y2="900" stroke="#484E61" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />

          {/* Overlapping Helical Curves (Pink & Lime Wireframe Lattice) */}
          {Array.from({ length: 18 }).map((_, i) => {
            const yOffset = i * 50;
            return (
              <g key={i}>
                {/* Left-to-right sweep */}
                <path
                  d={`M 30 ${yOffset} C 170 ${yOffset + 60}, 170 ${yOffset + 120}, 310 ${yOffset + 180}`}
                  stroke="url(#helixPink)"
                  strokeWidth="1.2"
                  strokeOpacity="0.5"
                />
                {/* Right-to-left sweep */}
                <path
                  d={`M 310 ${yOffset} C 170 ${yOffset + 60}, 170 ${yOffset + 120}, 30 ${yOffset + 180}`}
                  stroke="url(#helixLime)"
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                />
                {/* Horizontal Elliptical cross-sections */}
                <ellipse
                  cx="170"
                  cy={yOffset + 40}
                  rx="140"
                  ry="24"
                  stroke="#575E75"
                  strokeWidth="0.8"
                  strokeOpacity="0.35"
                />
              </g>
            );
          })}

          {/* 5 Centered Geodesic Spherical Core Nodes */}
          {[
            { y: 110, size: 54, cubeOffset: { x: 195, y: 160 } },
            { y: 280, size: 106, cubeOffset: { x: 235, y: 260 } },
            { y: 490, size: 58, cubeOffset: { x: 130, y: 440 } },
            { y: 690, size: 68, cubeOffset: { x: 195, y: 750 } },
            { y: 860, size: 56, cubeOffset: { x: 140, y: 820 } },
          ].map((node, idx) => {
            const half = node.size / 2;
            return (
              <g key={idx}>
                {/* Glow ring */}
                <circle
                  cx="170"
                  cy={node.y}
                  r={half + 6}
                  fill="#6388D9"
                  fillOpacity="0.1"
                />

                {/* Main Blue/Cyan Frosted Glass Square Backdrop */}
                <rect
                  x={170 - half}
                  y={node.y - half}
                  width={node.size}
                  height={node.size}
                  fill="#5479D6"
                  fillOpacity="0.75"
                  stroke="#8AB4F8"
                  strokeWidth="1"
                  rx="2"
                />

                {/* Geodesic Sphere Wireframe Overlay inside Square */}
                <circle
                  cx="170"
                  cy={node.y}
                  r={half * 0.85}
                  stroke="#FFFFFF"
                  strokeWidth="0.9"
                  strokeOpacity="0.75"
                  fill="url(#geoMesh)"
                />

                {/* Geodesic internal triangles */}
                <path
                  d={`M 170 ${node.y - half * 0.7} L ${170 + half * 0.6} ${node.y + half * 0.4} L ${170 - half * 0.6} ${node.y + half * 0.4} Z`}
                  stroke="#FFFFFF"
                  strokeWidth="0.75"
                  strokeOpacity="0.6"
                  fill="none"
                />
                <circle cx="170" cy={node.y} r="2" fill="#C6F36B" />

                {/* Orbiting Satellite Data Cube */}
                <rect
                  x={node.cubeOffset.x}
                  y={node.cubeOffset.y}
                  width="12"
                  height="12"
                  fill="#F8F38D"
                  stroke="#171916"
                  strokeWidth="0.5"
                  rx="1"
                  transform={`rotate(12 ${node.cubeOffset.x + 6} ${node.cubeOffset.y + 6})`}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Subtle Ambient Particles */}
      <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-2xs bg-[#C6F36B] opacity-75 animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 h-2.5 w-2.5 rounded-2xs bg-[#F8F38D] opacity-80" />

      {/* The BugBunny System Brand Watermark */}
      <div className="absolute bottom-8 right-8 text-right font-mono text-xs z-10 pointer-events-none">
        <div className="font-bold text-[#F5F5F0] tracking-wide text-sm flex items-center justify-end gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#C6F36B]" />
          <span>The BugBunny System</span>
        </div>
        <div className="text-[11px] text-[#9BA095] mt-0.5">
          Multi-Agent Autonomous Engineering
        </div>
      </div>
    </div>
  );
}

