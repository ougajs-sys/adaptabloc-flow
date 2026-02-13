import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const products = [
  { name: "Sneakers Urban Pro", sales: 156, revenue: 1248000, percent: 100 },
  { name: "T-Shirt Classic Fit", sales: 132, revenue: 660000, percent: 85 },
  { name: "Sac Bandoulière Cuir", sales: 98, revenue: 882000, percent: 63 },
  { name: "Casquette Sport", sales: 87, revenue: 261000, percent: 56 },
  { name: "Bracelet Perles", sales: 74, revenue: 148000, percent: 47 },
];

export function TopProducts() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-card-foreground">
          Produits populaires
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product) => (
          <div key={product.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-card-foreground font-medium truncate mr-4">{product.name}</span>
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                {product.sales} ventes
              </span>
            </div>
            <Progress value={product.percent} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
