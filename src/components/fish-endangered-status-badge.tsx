import { FishIcon, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function getFishEndangeredStatusInfo(status: string) {
  switch (status.toLowerCase()) {
    case "critically endangered":
      return {
        color: "bg-destructive",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "endangered":
      return {
        color: "bg-destructive/70",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "vulnerable":
      return {
        color: "bg-chart-1",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "near threatened":
      return {
        color: "bg-chart-2",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "least concern":
      return { color: "bg-primary", icon: <FishIcon className="w-4 h-4" /> };
    case "not evaluated":
    case "data deficient":
    default:
      return { color: "bg-muted-foreground", icon: <FishIcon className="w-4 h-4" /> };
  }
}

export function FishEndangeredStatusBadge({ status }: { status: string }) {
  const { color, icon } = getFishEndangeredStatusInfo(status);

  return (
    <Badge
      className={`${color} text-white px-3 py-1 text-sm font-semibold rounded-full flex items-center space-x-2`}
    >
      {icon}
      <span>{status}</span>
    </Badge>
  );
}
