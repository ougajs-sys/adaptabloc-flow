import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const data = [
  { month: "Jan", revenue: 420000, orders: 85 },
  { month: "Fév", revenue: 580000, orders: 112 },
  { month: "Mar", revenue: 650000, orders: 130 },
  { month: "Avr", revenue: 510000, orders: 98 },
  { month: "Mai", revenue: 720000, orders: 145 },
  { month: "Jun", revenue: 890000, orders: 178 },
  { month: "Jul", revenue: 950000, orders: 192 },
];

const chartConfig = {
  revenue: {
    label: "Chiffre d'affaires",
    color: "hsl(252, 85%, 60%)",
  },
  orders: {
    label: "Commandes",
    color: "hsl(168, 80%, 45%)",
  },
};

export function RevenueChart() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-card-foreground">
          Chiffre d'affaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(252, 85%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(252, 85%, 60%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toLocaleString("fr-FR")} FCFA`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(252, 85%, 60%)"
              fill="url(#fillRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
