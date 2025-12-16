import { Snowflake } from "lucide-react";

const SNOWFLAKES = Array.from({ length: 60 }, (_, i) => {
  const sizeCategory = i < 35 ? "sm" : i < 50 ? "md" : "lg";
  const size =
    sizeCategory === "sm"
      ? 8 + Math.random() * 6
      : sizeCategory === "md"
      ? 14 + Math.random() * 8
      : 22 + Math.random() * 10;
  const blur = sizeCategory === "lg" ? 0 : Math.random() < 0.5 ? 1 : 0;

  return {
    id: i,
    left: `${Math.random() * 120 - 10}%`,
    fallDuration: `${(Math.random() * 100 + 50) / 5}s`,
    flickrDuration: `${(Math.random() * 20 + 20) / 10}s`,
    delay: `${(Math.random() * -100) / 5}s`,
    size,
    blur,
    opacity: sizeCategory === "lg" ? 0.6 : sizeCategory === "md" ? 0.5 : 0.4,
  };
});

export function SnowfallBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {SNOWFLAKES.map((flake) => (
        <Snowflake
          key={flake.id}
          className="absolute top-0 text-card"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            filter: flake.blur ? `blur(${flake.blur}px)` : undefined,
            animation: `snowfall ${flake.fallDuration} linear infinite, flickr ${flake.flickrDuration} ease-in-out infinite`,
            animationDelay: `${flake.delay}, ${flake.delay}`,
          }}
        />
      ))}
    </div>
  );
}
