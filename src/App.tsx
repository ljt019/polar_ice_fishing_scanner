import { Weight, Clock, Home, Utensils, Ruler, Sparkles, Snowflake } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fish } from "@/hooks/use-fish-scanner";
import { SnowfallBackground } from "@/components/snowfall-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FishInfoCard } from "@/components/fish-info-card";
import { FishEndangeredStatusBadge } from "@/components/fish-endangered-status-badge";

import { useFishScanner } from "@/hooks/use-fish-scanner";
import { useFullscreenOnMount } from "@/hooks/use-fullscreen-on-mount";

function WaitingForFishContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-160 space-y-6">
      <h2 className="text-4xl font-bold text-primary">Welcome to the Polar Fish Explorer </h2>
      <p className="text-xl text-muted-foreground text-center max-w-3xl">
        Dive into the fascinating world of fish!
      </p>
      <img
        src="/ice-hole.svg"
        alt="Ice fishing hole"
        className="w-[20vw] h-[20vw] min-w-32 min-h-32 max-w-64 max-h-64"
      />
      <p className="text-xl text-muted-foreground text-center max-w-3xl">
        Once you've caught a fish at the fishing pond, you can scan it here and uncover fascinating
        facts about your unique catch.
      </p>
    </div>
  );
}

function FishDisplayContent({ fish }: { fish: Fish }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6 min-h-160">
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
        <Card className="w-full h-[35vh] min-h-48 overflow-hidden relative p-0">
          <img src={fish.image_path} alt={fish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-primary/50 to-transparent"></div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground italic">{fish.blurb}</p>
        </Card>
      </div>
    </div>
  );
}

const springAnimation = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, damping: 18, stiffness: 350 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

//import.meta.env.PROD

export default function App() {
  const { fish } = useFishScanner({ debugKey: "f" });
  useFullscreenOnMount({ enabled: true });

  return (
    <div className="min-h-screen bg-linear-to-b from-secondary to-accent flex flex-col justify-center items-center p-4 relative">
      <SnowfallBackground />
      <Card className="w-[95vw] max-w-6xl bg-card shadow-lg overflow-hidden z-10 py-0">
        <CardHeader className="bg-primary text-primary-foreground py-4 rounded-none">
          <CardTitle className="text-3xl font-bold flex items-center justify-between">
            <span>Sno-Port Polar Fish Explorer</span>
            <Snowflake className="w-8 h-8" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {fish ? (
              <motion.div
                key="fish-display"
                variants={springAnimation}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <FishDisplayContent fish={fish} />
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                variants={springAnimation}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <WaitingForFishContent />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
