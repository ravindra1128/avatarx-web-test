import React from "react";

const CurvedProgressArc = ({ progress = 66 }) => {
  const width = 360;
  const height = 20;
  const strokeWidth = 20;
  
  // Create a more pronounced curved path that goes UP in the middle
  const startX = strokeWidth / 2;
  const endX = width - strokeWidth / 2;
  const centerY = height / 2;
  // Control point for a more pronounced upward curve
  const controlY = centerY + 12; // Increased curve for more visibility
  
  const fullPath = `M ${startX} ${centerY} Q ${width / 2} ${controlY} ${endX} ${centerY}`;
  
  // Calculate progress point on the curve
  const progressX = startX + (endX - startX) * (progress / 100);
  const progressY = centerY + 12 * Math.sin(Math.PI * (progress / 100));
  
  const progressPath = `M ${startX} ${centerY} Q ${width / 2} ${controlY} ${progressX} ${progressY}`;
  
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Background curved path */}
      <path
        d={fullPath}
        fill="transparent"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Progress curved path */}
      <path
        d={progressPath}
        fill="transparent"
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default CurvedProgressArc;
