import { useEffect } from "react";
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
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useFishScanner, Fish } from "@/hooks/useFishScanner";
import { SnowfallBackground } from "@/components/SnowfallBackground";

const appWindow = getCurrentWebviewWindow();

function DefaultScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <h2 className="text-4xl font-bold text-blue-700">Welcome to Polar Ice Fishing</h2>
      <p className="text-xl text-gray-600 text-center max-w-2xl">
        Dive into the fascinating world of fish! Catch a fish, scan it, and uncover fascinating
        facts about your unique catch.
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
          <InfoCard icon={<Ruler className="w-5 h-5" />} title="Size" value={fish.average_size} />
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
          <InfoCard icon={<Home className="w-5 h-5" />} title="Habitat" value={fish.habitat} />
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
          <img src={fish.image_path} alt={fish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-blue-500/50 to-transparent"></div>
        </div>
        <div className="bg-blue-200 p-4 rounded-lg shadow-inner">
          <p className="text-sm text-gray-600 italic">{fish.blurb}</p>
        </div>
      </div>
    </div>
  );
}

function FunFactCard({ funFact, className = "" }: { funFact: string; className?: string }) {
  return (
    <div className={`bg-blue-100 p-3 rounded-lg shadow flex items-start space-x-3 ${className}`}>
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
  icon: React.ReactNode;
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`bg-gray-300/50 p-3 rounded-lg shadow flex items-start space-x-3 ${className}`}>
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

function getStatusInfo(status: string): { color: string; icon: React.ReactNode } {
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
  const { fish } = useFishScanner({ displayDurationSeconds: 10, debugKey: "a" });

  // Fullscreen in production
  useEffect(() => {
    if (import.meta.env.PROD) {
      const maximizeAndFullscreen = async () => {
        try {
          await appWindow.maximize();
          setTimeout(() => appWindow.setFullscreen(true), 500);
        } catch (err) {
          console.error("Error during window manipulation:", err);
        }
      };
      maximizeAndFullscreen();
    }
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-100 to-blue-200 flex flex-col justify-center items-center p-4 relative">
      <SnowfallBackground />
      <Card className="w-full max-w-4xl bg-white/80 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden border-4 border-blue-300 z-10">
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
    </div>
  );
}
