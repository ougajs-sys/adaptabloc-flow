import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  iconBgClass?: string;
}

export function KpiCard({ title, value, change, icon: Icon, iconBgClass = "bg-primary/10 text-primary" }: KpiCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-[Space_Grotesk] text-card-foreground">{value}</p>
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp size={14} className="text-accent" />
              ) : (
                <TrendingDown size={14} className="text-destructive" />
              )}
              <span className={cn("font-medium", isPositive ? "text-accent" : "text-destructive")}>
                {isPositive ? "+" : ""}{change}%
              </span>
              <span className="text-muted-foreground">vs mois dernier</span>
            </div>
          </div>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgClass)}>
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
