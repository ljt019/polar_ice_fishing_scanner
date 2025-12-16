import { Weight, Clock, Home, Utensils, Ruler, Sparkles, Snowflake } from "lucide-react";
import { Fish } from "@/hooks/use-fish-scanner";
import { SnowfallBackground } from "@/components/snowfall-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FishInfoCard } from "@/components/fish-info-card";
import { FishEndangeredStatusBadge } from "@/components/fish-endangered-status-badge";

import { useFishScanner } from "@/hooks/use-fish-scanner";
import { useFullscreenOnMount } from "@/hooks/use-fullscreen-on-mount";

interface DisplayFishViewProps {
  fish: Fish;
}

function DisplayFishView({ fish }: DisplayFishViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-primary border-b-2 border-border pb-2">
          {fish.name}
        </h2>
        <FishEndangeredStatusBadge status={fish.endangered_status} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FishInfoCard
            icon={<Ruler className="w-5 h-5" />}
            title="Size"
            value={fish.average_size}
          />
          <FishInfoCard
            icon={<Weight className="w-5 h-5" />}
            title="Weight"
            value={fish.average_weight}
          />
          <FishInfoCard
            icon={<Clock className="w-5 h-5" />}
            title="Lifespan"
            value={fish.average_lifespan}
          />
          <FishInfoCard icon={<Home className="w-5 h-5" />} title="Habitat" value={fish.habitat} />
          <FishInfoCard
            icon={<Utensils className="w-5 h-5" />}
            title="Diet"
            value={fish.diet}
            className="sm:col-span-2"
          />
          <FishInfoCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Fun Fact"
            value={fish.fun_fact}
            className="sm:col-span-2"
          />
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div className="w-full h-80 bg-secondary rounded-lg overflow-hidden relative shadow-lg">
          <img src={fish.image_path} alt={fish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-primary/50 to-transparent"></div>
        </div>
        <div className="bg-accent p-4 rounded-lg shadow-inner">
          <p className="text-sm text-accent-foreground italic">{fish.blurb}</p>
        </div>
      </div>
    </div>
  );
}

function WaitingForFishView() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <h2 className="text-4xl font-bold text-primary">Welcome to Polar Ice Fishing</h2>
      <p className="text-xl text-muted-foreground text-center max-w-2xl">
        Dive into the fascinating world of fish! Catch a fish, scan it, and uncover fascinating
        facts about your unique catch.
      </p>
    </div>
  );
}

function App() {
  const { fish } = useFishScanner({ displayDurationSeconds: 10, debugKey: "a" });
  useFullscreenOnMount({ enabled: import.meta.env.PROD });

  return (
    <div className="min-h-screen bg-linear-to-b from-secondary to-accent flex flex-col justify-center items-center p-4 relative">
      <SnowfallBackground />
      <Card className="w-full max-w-4xl bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden border-4 border-none z-10 py-0">
        <CardHeader className="bg-primary text-primary-foreground py-4 rounded-none">
          <CardTitle className="text-3xl font-bold flex items-center justify-between">
            <span>Polar Fish Explorer</span>
            <Snowflake className="w-8 h-8" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {fish ? <DisplayFishView fish={fish} /> : <WaitingForFishView />}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
