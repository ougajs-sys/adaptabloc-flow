import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
  completed: { label: "Livrées", color: "hsl(168, 80%, 45%)" },
  pending: { label: "En cours", color: "hsl(38, 95%, 55%)" },
  cancelled: { label: "Annulées", color: "hsl(0, 84%, 60%)" },
};

interface Props {
  data: { day: string; completed: number; pending: number; cancelled: number }[];
}

export function OrdersChart({ data }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-card-foreground">
          Commandes cette semaine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis tickLine={false} axisLine={false} className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="completed" stackId="a" fill="hsl(168, 80%, 45%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="hsl(38, 95%, 55%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="cancelled" stackId="a" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
