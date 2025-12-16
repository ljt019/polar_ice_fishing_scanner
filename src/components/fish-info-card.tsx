import { cn } from "@/lib/utils";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";

interface FishInfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  className?: string;
}

export function FishInfoCard({ icon, title, value, className }: FishInfoCardProps) {
  return (
    <Item className={cn("bg-muted shadow", className)}>
      <ItemMedia className="bg-accent p-2 rounded-full text-muted-foreground">{icon}</ItemMedia>
      <ItemContent>
        <ItemTitle className="text-primary">{title}</ItemTitle>
        <ItemDescription>{value}</ItemDescription>
      </ItemContent>
    </Item>
  );
}
