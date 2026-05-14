import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { normalize } from "@/lib/normalize";
import { usePagination } from "@/hooks/usePagination";
import { DataPagination } from "@/components/ui/data-pagination";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Package, AlertTriangle, Loader2 } from "lucide-react";
import { NewProductDialog, type NewProductFormValues } from "@/components/products/NewProductDialog";
import { EditProductDialog, type EditProductFormValues } from "@/components/products/EditProductDialog";
import { ProductDetailDialog } from "@/components/products/ProductDetailDialog";
import { ExportButton } from "@/components/shared/ExportButton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductVariant {
  id?: string;
  label: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  maxStock: number;
  variants: ProductVariant[];
  image: string;
  status: "active" | "draft" | "out_of_stock";
  sales: number;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Actif", variant: "default" },
  draft: { label: "Brouillon", variant: "secondary" },
  out_of_stock: { label: "Rupture", variant: "destructive" },
};

const Products = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading: loading } = useQuery<Product[]>({
    queryKey: ["products", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data: prods, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        throw error;
      }

      const productIds = (prods || []).map((p) => p.id);
      const [{ data: variants }, { data: salesRows }] = await Promise.all([
        productIds.length > 0
          ? supabase.from("product_variants").select("*").in("product_id", productIds)
          : Promise.resolve({ data: [] }),
        productIds.length > 0
          ? supabase.from("order_items").select("product_id, quantity").in("product_id", productIds)
          : Promise.resolve({ data: [] }),
      ]);

      const variantMap = new Map<string, ProductVariant[]>();
      (variants || []).forEach((v) => {
        const list = variantMap.get(v.product_id) || [];
        list.push({ id: v.id, label: v.name, stock: v.stock ?? 0 });
        variantMap.set(v.product_id, list);
      });

      const salesMap = new Map<string, number>();
      (salesRows || []).forEach((row) => {
        salesMap.set(row.product_id, (salesMap.get(row.product_id) || 0) + (row.quantity || 0));
      });

      return (prods || []).map((p) => {
        const pvs = variantMap.get(p.id) || [];
        const totalStock = pvs.length > 0 ? pvs.reduce((s, v) => s + v.stock, 0) : (p.stock ?? 0);
        return {
          id: p.id,
          name: p.name,
          category: p.category || "Autre",
          price: p.price,
          stock: totalStock,
          maxStock: p.stock_alert_threshold ? Math.max(totalStock, p.stock_alert_threshold * 10) : Math.max(totalStock, 100),
          variants: pvs,
          image: p.image_url || "📦",
          status: !p.is_active ? "draft" : totalStock === 0 ? "out_of_stock" : "active",
          sales: salesMap.get(p.id) || 0,
        };
      });
    },
  });

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products", storeId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", storeId] });
  };

  const handleNewProduct = async (values: NewProductFormValues) => {
    if (!storeId) return;
    const totalStock = values.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
    const { data: newProd, error } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        name: values.name,
        category: values.category,
        price: values.price,
        stock: totalStock,
        image_url: values.image,
        is_active: values.status === "active",
        stock_alert_threshold: Math.round(values.maxStock * 0.15),
      })
      .select()
      .single();

    if (error || !newProd) {
      toast({ title: "Erreur", description: error?.message, variant: "destructive" });
      return;
    }

    // Insert variants
    if (values.variants.length > 0) {
      const { error: variantError } = await supabase.from("product_variants").insert(
        values.variants.map((v) => ({
          product_id: newProd.id,
          name: v.label ?? "",
          stock: v.stock ?? 0,
        }))
      );
      if (variantError) {
        toast({ title: "Produit créé, erreur variantes", description: variantError.message, variant: "destructive" });
        invalidateProducts();
        return;
      }
    }

    toast({ title: "Produit ajouté" });
    invalidateProducts();
  };

  const handleEditProduct = async (values: EditProductFormValues) => {
    if (!editingProduct || !storeId) return;
    const totalStock = values.variants.reduce((s, v) => s + (v.stock ?? 0), 0);

    await supabase
      .from("products")
      .update({
        name: values.name,
        category: values.category,
        price: values.price,
        stock: totalStock,
        image_url: values.image,
        is_active: values.status !== "draft",
        stock_alert_threshold: Math.round(values.maxStock * 0.15),
      })
      .eq("id", editingProduct.id);

    // Replace variants: delete old, insert new
    await supabase.from("product_variants").delete().eq("product_id", editingProduct.id);
    if (values.variants.length > 0) {
      const { error: variantError } = await supabase.from("product_variants").insert(
        values.variants.map((v) => ({
          product_id: editingProduct.id,
          name: v.label,
          stock: v.stock,
        }))
      );
      if (variantError) {
        toast({ title: "Produit modifié, erreur variantes", description: variantError.message, variant: "destructive" });
        invalidateProducts();
        return;
      }
    }

    toast({ title: "Produit modifié" });
    setEditingProduct(null);
    invalidateProducts();
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    await supabase.from("product_variants").delete().eq("product_id", deletingProduct.id);
    const { error } = await supabase.from("products").delete().eq("id", deletingProduct.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produit supprimé" });
    }
    setDeletingProduct(null);
    invalidateProducts();
  };

  const categories = [...new Set(products.map((p) => p.category))];
  const filtered = products.filter((p) => {
    const q = normalize(search);
    const matchSearch = normalize(p.name).includes(q) || normalize(p.id).includes(q);
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const PAGE_SIZE = 20;
  const { page, totalPages, paginated: paginatedProducts, next, prev, goTo, total: filteredTotal } = usePagination(filtered, PAGE_SIZE);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.maxStock * 0.15).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  if (loading) {
    return (
      <DashboardLayout title="Produits">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
    <NewProductDialog open={newProductOpen} onOpenChange={setNewProductOpen} onSubmit={handleNewProduct} />
    <ProductDetailDialog
      product={selectedProduct}
      open={!!selectedProduct}
      onOpenChange={(v) => { if (!v) setSelectedProduct(null); }}
      onEdit={(p) => setEditingProduct(p)}
      onDelete={(p) => setDeletingProduct(p)}
    />
    {editingProduct && (
      <EditProductDialog
        open={!!editingProduct}
        onOpenChange={(v) => { if (!v) setEditingProduct(null); }}
        onSubmit={handleEditProduct}
        defaultValues={{
          name: editingProduct.name, category: editingProduct.category, price: editingProduct.price,
          maxStock: editingProduct.maxStock, image: editingProduct.image, status: editingProduct.status,
          variants: editingProduct.variants.map((v) => ({ label: v.label, stock: v.stock })),
        }}
      />
    )}
    <AlertDialog open={!!deletingProduct} onOpenChange={(v) => { if (!v) setDeletingProduct(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer "{deletingProduct?.name}" ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <DashboardLayout
      title="Produits"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={products.map((p) => ({
              name: p.name,
              category: p.category,
              price: p.price,
              stock: p.stock,
              max_stock: p.maxStock,
              status: p.status,
              variants: p.variants.map((v) => `${v.label}(${v.stock})`).join(" | "),
            }))}
            columns={[
              { key: "name", label: "Produit" },
              { key: "category", label: "Catégorie" },
              { key: "price", label: "Prix (FCFA)" },
              { key: "stock", label: "Stock" },
              { key: "max_stock", label: "Stock max" },
              { key: "status", label: "Statut" },
              { key: "variants", label: "Variantes" },
            ]}
            filename="produits"
            printTitle="Produits Intramate"
          />
          <Button size="sm" className="gap-2" onClick={() => setNewProductOpen(true)}><Plus size={16} /> Ajouter un produit</Button>
        </div>
      }
    >
      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock > 0 && <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"><AlertTriangle size={16} /><span>{outOfStock} produit{outOfStock > 1 ? "s" : ""} en rupture</span></div>}
          {lowStock > 0 && <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm"><AlertTriangle size={16} /><span>{lowStock} produit{lowStock > 1 ? "s" : ""} stock faible</span></div>}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aucun produit trouvé</p>
          <p className="text-sm">Ajoutez votre premier produit pour commencer.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => {
            const stockPercent = product.maxStock > 0 ? Math.round((product.stock / product.maxStock) * 100) : 0;
            const isLow = stockPercent > 0 && stockPercent <= 15;
            const st = statusLabels[product.status];
            return (
              <Card key={product.id} className="border-border/60 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">{product.image}</div>
                    <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-card-foreground leading-tight">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <p className="text-lg font-bold font-[Space_Grotesk] text-card-foreground">{product.price.toLocaleString("fr-FR")} F</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isLow ? "text-destructive font-medium" : "text-muted-foreground"}>Stock : {product.stock}/{product.maxStock}</span>
                      <span className="text-muted-foreground">{product.sales} ventes</span>
                    </div>
                    <Progress value={stockPercent} className={`h-1.5 ${isLow ? "[&>div]:bg-destructive" : ""}`} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.variants.slice(0, 3).map((v) => <span key={v.label} className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{v.label}</span>)}
                    {product.variants.length > 3 && <span className="text-xs text-muted-foreground">+{product.variants.length - 3}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <DataPagination page={page} totalPages={totalPages} total={filteredTotal} pageSize={PAGE_SIZE} onPrev={prev} onNext={next} onGoTo={goTo} />
        </>
      )}
    </DashboardLayout>
    </>
  );
};

export default Products;
