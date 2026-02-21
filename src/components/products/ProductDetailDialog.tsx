import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  maxStock: number;
  variants: { label: string; stock: number }[];
  image: string;
  status: "active" | "draft" | "out_of_stock";
  sales: number;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Actif", variant: "default" },
  draft: { label: "Brouillon", variant: "secondary" },
  out_of_stock: { label: "Rupture", variant: "destructive" },
};

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange, onEdit, onDelete }: Props) {
  if (!product) return null;
  const stockPercent = Math.round((product.stock / product.maxStock) * 100);
  const st = statusLabels[product.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <span className="text-2xl">{product.image}</span> {product.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge variant={st.variant}>{st.label}</Badge>
            <Badge variant="outline">{product.category}</Badge>
            <Badge variant="secondary" className="text-xs">{product.id}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Prix</span>
              <p className="text-lg font-bold font-[Space_Grotesk]">{product.price.toLocaleString("fr-FR")} F</p>
            </div>
            <div>
              <span className="text-muted-foreground">Ventes totales</span>
              <p className="text-lg font-bold font-[Space_Grotesk]">{product.sales}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stock</span>
              <span className="font-medium">{product.stock} / {product.maxStock}</span>
            </div>
            <Progress value={stockPercent} className="h-2" />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Variantes</p>
            <div className="space-y-1">
              {product.variants.map((v) => (
                <div key={v.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{v.label}</span>
                  <span className="font-medium">{v.stock} en stock</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => { onOpenChange(false); onEdit(product); }}>
              <Pencil size={14} /> Modifier
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={() => { onOpenChange(false); onDelete(product); }}>
              <Trash2 size={14} /> Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
