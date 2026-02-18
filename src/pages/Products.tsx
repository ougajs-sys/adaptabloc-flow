import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Package, AlertTriangle } from "lucide-react";
import { NewProductDialog, type NewProductFormValues } from "@/components/products/NewProductDialog";

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

const mockProducts: Product[] = [
  {
    id: "PRD-001", name: "Sneakers Urban Pro", category: "Chaussures", price: 25000, stock: 45, maxStock: 100,
    variants: [
      { label: "40 - Noir", stock: 12 }, { label: "41 - Noir", stock: 8 },
      { label: "42 - Noir", stock: 15 }, { label: "42 - Blanc", stock: 10 },
    ],
    image: "👟", status: "active", sales: 156,
  },
  {
    id: "PRD-002", name: "T-Shirt Classic Fit", category: "Vêtements", price: 10000, stock: 230, maxStock: 300,
    variants: [
      { label: "S - Blanc", stock: 40 }, { label: "M - Blanc", stock: 60 },
      { label: "L - Blanc", stock: 50 }, { label: "M - Noir", stock: 80 },
    ],
    image: "👕", status: "active", sales: 132,
  },
  {
    id: "PRD-003", name: "Sac Bandoulière Cuir", category: "Accessoires", price: 28500, stock: 18, maxStock: 50,
    variants: [
      { label: "Marron", stock: 10 }, { label: "Noir", stock: 8 },
    ],
    image: "👜", status: "active", sales: 98,
  },
  {
    id: "PRD-004", name: "Robe Été Fleurie", category: "Vêtements", price: 18000, stock: 5, maxStock: 80,
    variants: [
      { label: "S", stock: 1 }, { label: "M", stock: 2 }, { label: "L", stock: 2 },
    ],
    image: "👗", status: "active", sales: 74,
  },
  {
    id: "PRD-005", name: "Casquette Sport", category: "Accessoires", price: 8000, stock: 120, maxStock: 200,
    variants: [{ label: "Taille unique - Noir", stock: 60 }, { label: "Taille unique - Blanc", stock: 60 }],
    image: "🧢", status: "active", sales: 87,
  },
  {
    id: "PRD-006", name: "Montre Sport Digitale", category: "Accessoires", price: 22000, stock: 0, maxStock: 40,
    variants: [{ label: "Noir", stock: 0 }, { label: "Bleu", stock: 0 }],
    image: "⌚", status: "out_of_stock", sales: 45,
  },
  {
    id: "PRD-007", name: "Ensemble Jogging Premium", category: "Vêtements", price: 35000, stock: 32, maxStock: 60,
    variants: [
      { label: "M - Gris", stock: 12 }, { label: "L - Gris", stock: 10 }, { label: "XL - Noir", stock: 10 },
    ],
    image: "🏃", status: "active", sales: 63,
  },
  {
    id: "PRD-008", name: "Sandales Dorées", category: "Chaussures", price: 15000, stock: 28, maxStock: 70,
    variants: [
      { label: "37", stock: 8 }, { label: "38", stock: 10 }, { label: "39", stock: 10 },
    ],
    image: "👡", status: "active", sales: 52,
  },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Actif", variant: "default" },
  draft: { label: "Brouillon", variant: "secondary" },
  out_of_stock: { label: "Rupture", variant: "destructive" },
};

let productCounter = mockProducts.length + 1;

const Products = () => {
  const [products, setProducts] = useState(mockProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newProductOpen, setNewProductOpen] = useState(false);

  const handleNewProduct = (values: NewProductFormValues) => {
    const id = `PRD-${String(productCounter++).padStart(3, "0")}`;
    const totalStock = values.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
    setProducts((prev) => [
      {
        id,
        name: values.name,
        category: values.category,
        price: values.price,
        stock: totalStock,
        maxStock: values.maxStock,
        variants: values.variants.map((v) => ({ label: v.label ?? "", stock: v.stock ?? 0 })),
        image: values.image,
        status: values.status as "active" | "draft" | "out_of_stock",
        sales: 0,
      },
      ...prev,
    ]);
  };

  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.maxStock * 0.15).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <>
    <NewProductDialog open={newProductOpen} onOpenChange={setNewProductOpen} onSubmit={handleNewProduct} />
    <DashboardLayout
      title="Produits"
      actions={
        <Button size="sm" className="gap-2" onClick={() => setNewProductOpen(true)}>
          <Plus size={16} /> Ajouter un produit
        </Button>
      }
    >
      {/* Alerts */}
      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
              <AlertTriangle size={16} />
              <span>{outOfStock} produit{outOfStock > 1 ? "s" : ""} en rupture de stock</span>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm">
              <AlertTriangle size={16} />
              <span>{lowStock} produit{lowStock > 1 ? "s" : ""} stock faible</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product) => {
          const stockPercent = Math.round((product.stock / product.maxStock) * 100);
          const isLow = stockPercent > 0 && stockPercent <= 15;
          const st = statusLabels[product.status];

          return (
            <Card key={product.id} className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                    {product.image}
                  </div>
                  <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-card-foreground leading-tight">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.category} · {product.id}</p>
                </div>

                <p className="text-lg font-bold font-[Space_Grotesk] text-card-foreground">
                  {product.price.toLocaleString("fr-FR")} F
                </p>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={isLow ? "text-destructive font-medium" : "text-muted-foreground"}>
                      Stock : {product.stock}/{product.maxStock}
                    </span>
                    <span className="text-muted-foreground">{product.sales} ventes</span>
                  </div>
                  <Progress
                    value={stockPercent}
                    className={`h-1.5 ${isLow ? "[&>div]:bg-destructive" : ""}`}
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {product.variants.slice(0, 3).map((v) => (
                    <span key={v.label} className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      {v.label}
                    </span>
                  ))}
                  {product.variants.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{product.variants.length - 3}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
    </>
  );
};

export default Products;
