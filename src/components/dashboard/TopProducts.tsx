import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface Props {
  products: TopProduct[];
}

export function TopProducts({ products }: Props) {
  const maxSales = products.length > 0 ? products[0].sales : 1;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-card-foreground">
          Produits populaires
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune vente pour le moment</p>
        ) : (
          products.map((product) => (
            <div key={product.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-card-foreground font-medium truncate mr-4">{product.name}</span>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {product.sales} ventes
                </span>
              </div>
              <Progress value={Math.round((product.sales / maxSales) * 100)} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
