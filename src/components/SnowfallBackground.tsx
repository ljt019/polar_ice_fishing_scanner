import { Snowflake } from "lucide-react";

const SNOWFLAKES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  duration: `${Math.random() * 15 + 20}s`,
  delay: `${Math.random() * 20}s`,
  size: `${Math.random() * 10 + 10}px`,
}));

export function SnowfallBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {SNOWFLAKES.map((flake) => (
        <Snowflake
          key={flake.id}
          className="absolute text-blue-400/50 animate-snowfall"
          style={{
            left: flake.left,
            fontSize: flake.size,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
          }}
        />
      ))}
    </div>
  );
}
