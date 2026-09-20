import React from "react";

/**
 * LoadingSpinner
 * A 12-bar fading "activity indicator" style loading animation,
 * similar to the classic iOS/macOS spinner shown in loading screens.
 *
 * Props:
 *  - size:  overall width/height of the spinner in px (default 120)
 *  - color: bar color (default white)
 *  - speed: full rotation cycle duration in seconds (default 1.2)
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner size={80} color="#4f9eff" speed={1} />
 */
const NUM_BARS = 12;

const LoadingSpinner = ({ size = 120, color = "#ffffff", speed = 1.2 }) => {
  const barWidth = size * 0.08;
  const barHeight = size * 0.26;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      {Array.from({ length: NUM_BARS }).map((_, i) => {
        const rotation = (360 / NUM_BARS) * i;
        // Stagger each bar's fade so opacity sweeps around the circle
        const delay = -speed + (speed / NUM_BARS) * i;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: barWidth,
                height: barHeight,
                marginLeft: -barWidth / 2,
                borderRadius: barWidth / 2,
                backgroundColor: color,
                animation: `spinner-fade ${speed}s linear infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          </div>
        );
      })}

      <style>{`
        @keyframes spinner-fade {
          0%   { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
