
import { useState, useEffect, useRef } from "react";
import {
  Snowflake,
  FishIcon,
  Weight,
  Clock,
  Home,
  Utensils,
  Ruler,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";

interface Fish {
  id: number;
  name: string;
  average_size: string;
  average_weight: string;
  average_lifespan: string;
  habitat: string;
  diet: string;
  endangered_status: string;
  blurb: string;
  image_path: string;
  fun_fact: string;
}

// Time to display fish information
const fish_info_display_time_in_seconds = 10; // 10 seconds

// Convert seconds to milliseconds
const fish_info_display_time = fish_info_display_time_in_seconds * 1000;

// Maximum number of snowflakes allowed on screen
const MAX_SNOWFLAKES = 50; // Easily editable variable

interface SnowflakeData {
  id: number;
  left: string;
  fontSize: string;
  animationDuration: number; // in milliseconds
  animationDelay: number; // in milliseconds
}

function DefaultScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <h2 className="text-4xl font-bold text-blue-700">
        Welcome to Polar Ice Fishing
      </h2>
      <p className="text-xl text-gray-600 text-center max-w-2xl">
        Dive into the fascinating world of fish! Catch a fish, scan it, and
        uncover fascinating facts about your unique catch.
      </p>
    </div>
  );
}

function FishDisplay({ fish }: { fish: Fish }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-blue-700 border-b-2 border-blue-300 pb-2">
          {fish.name}
        </h2>
        <EndangeredStatusBadge status={fish.endangered_status} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard
            icon={<Ruler className="w-5 h-5" />}
            title="Size"
            value={fish.average_size}
          />
          <InfoCard
            icon={<Weight className="w-5 h-5" />}
            title="Weight"
            value={fish.average_weight}
          />
          <InfoCard
            icon={<Clock className="w-5 h-5" />}
            title="Lifespan"
            value={fish.average_lifespan}
          />
          <InfoCard
            icon={<Home className="w-5 h-5" />}
            title="Habitat"
            value={fish.habitat}
          />
          <InfoCard
            icon={<Utensils className="w-5 h-5" />}
            title="Diet"
            value={fish.diet}
            className="sm:col-span-2"
          />
          <FunFactCard funFact={fish.fun_fact} className="sm:col-span-2" />
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div className="w-full h-80 bg-blue-100 rounded-lg overflow-hidden relative shadow-lg">
          <img
            src={fish.image_path}
            alt={fish.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/50 to-transparent"></div>
        </div>
        <div className="bg-blue-200 p-4 rounded-lg shadow-inner">
          <p className="text-sm text-gray-600 italic">{fish.blurb}</p>
        </div>
      </div>
    </div>
  );
}

function FunFactCard({
  funFact,
  className = "",
}: {
  funFact: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-blue-100 p-3 rounded-lg shadow flex items-start space-x-3 ${className}`}
    >
      <div className="bg-blue-300 p-2 rounded-full">
        <Sparkles className="w-5 h-5 text-blue-700" />
      </div>
      <div>
        <h3 className="font-semibold text-blue-800">Fun Fact</h3>
        <p className="text-sm text-gray-600">{funFact}</p>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
  className = "",
}: {
  icon: JSX.Element;
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-gray-300/50 p-3 rounded-lg shadow flex items-start space-x-3 ${className}`}
    >
      <div className="bg-blue-300 p-2 rounded-full">{icon}</div>
      <div>
        <h3 className="font-semibold text-blue-800">{title}</h3>
        <p className="text-sm text-gray-600">{value}</p>
      </div>
    </div>
  );
}

function EndangeredStatusBadge({ status }: { status: string }) {
  const { color, icon } = getStatusInfo(status);

  return (
    <Badge
      className={`${color} text-white px-3 py-1 text-sm font-semibold rounded-full flex items-center space-x-2`}
    >
      {icon}
      <span>{status}</span>
    </Badge>
  );
}

function getStatusInfo(status: string): { color: string; icon: JSX.Element } {
  switch (status.toLowerCase()) {
    case "critically endangered":
      return {
        color: "bg-red-500",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "endangered":
      return {
        color: "bg-orange-500",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "vulnerable":
      return {
        color: "bg-yellow-500",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "near threatened":
      return {
        color: "bg-yellow-400",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "least concern":
      return { color: "bg-green-500", icon: <FishIcon className="w-4 h-4" /> };
    case "not evaluated":
    case "data deficient":
    default:
      return { color: "bg-gray-500", icon: <FishIcon className="w-4 h-4" /> };
  }
}

export function Index() {
  const [fish, setFish] = useState<Fish | null>(null);
  const [snowflakes, setSnowflakes] = useState<SnowflakeData[]>([]);
  const snowflakeIdRef = useRef(0);

  useEffect(() => {
    // Maximize window first, then go fullscreen after half a second
    const maximizeAndFullscreen = async () => {
      try {
        await appWindow.maximize(); // Maximize the window
        setTimeout(async () => {
          await appWindow.setFullscreen(true); // Fullscreen after 500ms
        }, 500);
      } catch (err) {
        console.error("Error during window manipulation:", err);
      }
    };

    maximizeAndFullscreen();
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    const setupListener = async () => {
      unlisten = await listen<Fish>("fishData", (event: any) => {
        setFish(event.payload);
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  useEffect(() => {
    if (fish) {
      const timeout = setTimeout(() => {
        setFish(null); // Reset fish state to show DefaultScreen
      }, fish_info_display_time);

      return () => clearTimeout(timeout); // Cleanup timeout
    }
  }, [fish]);

  useEffect(() => {
    let interval: number | null = null;

    const addSnowflake = () => {
      setSnowflakes((prevSnowflakes) => {
        if (prevSnowflakes.length >= MAX_SNOWFLAKES) {
          return prevSnowflakes;
        }

        const id = snowflakeIdRef.current++;
        const left = `${Math.random() * 100}%`;
        const fontSize = `${Math.random() * 10 + 10}px`;
        const animationDuration = Math.random() * 10 + 25; // in seconds
        const animationDelay = Math.random() * 10; // in seconds

        const newSnowflake: SnowflakeData = {
          id,
          left,
          fontSize,
          animationDuration: animationDuration * 1000, // convert to ms
          animationDelay: animationDelay * 1000, // convert to ms
        };

        // Schedule removal of the snowflake after its animation ends
        setTimeout(() => {
          setSnowflakes((current) =>
            current.filter((flake) => flake.id !== id)
          );
        }, newSnowflake.animationDuration + newSnowflake.animationDelay + 1000); // extra buffer time

        return [...prevSnowflakes, newSnowflake];
      });
    };

    interval = window.setInterval(() => {
      addSnowflake();
    }, 1500); // Add a new snowflake every 1.5 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex flex-col justify-center items-center p-4 relative">
        <Card
          className="w-full max-w-4xl bg-white/80 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden border-4 border-blue-300"
          style={{ zIndex: 1 }}
        >
          <CardHeader className="bg-blue-500 text-white">
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              <span>Polar Fish Explorer</span>
              <Snowflake className="w-8 h-8" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {fish ? <FishDisplay fish={fish} /> : <DefaultScreen />}
          </CardContent>
        </Card>
        <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
          {snowflakes.map((flake) => (
            <Snowflake
              key={flake.id}
              className="text-blue-400 opacity-50 absolute"
              style={{
                left: flake.left,
                top: `-10%`,
                fontSize: flake.fontSize,
                animation: `snowfall ${flake.animationDuration}ms linear`,
                animationDelay: `${flake.animationDelay}ms`,
                zIndex: -1,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
