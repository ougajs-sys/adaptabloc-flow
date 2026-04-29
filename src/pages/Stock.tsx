import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  AlertTriangle,
  Package,
  History,
  TrendingUp,
  RefreshCcw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ExportButton } from "@/components/shared/ExportButton";

interface Product {
  id: string;
  name: string;
  category: string | null;
  stock: number;
  stock_alert_threshold: number | null;
}

interface Movement {
  id: string;
  product_id: string;
  product_name: string;
  type: "in" | "out" | "adjustment" | "sale" | "return";
  quantity: number;
  reason: string | null;
  reference: string | null;
  created_at: string;
}

const TYPE_CONFIG = {
  in: { label: "Entrée", icon: ArrowDownToLine, color: "bg-accent/10 text-accent border-accent/30" },
  out: { label: "Sortie", icon: ArrowUpFromLine, color: "bg-destructive/10 text-destructive border-destructive/30" },
  adjustment: { label: "Ajustement", icon: RefreshCcw, color: "bg-primary/10 text-primary border-primary/30" },
  sale: { label: "Vente", icon: TrendingUp, color: "bg-[hsl(280,80%,55%)]/10 text-[hsl(280,80%,55%)] border-[hsl(280,80%,55%)]/30" },
  return: { label: "Retour", icon: ArrowDownToLine, color: "bg-[hsl(38,95%,55%)]/10 text-[hsl(38,95%,55%)] border-[hsl(38,95%,55%)]/30" },
};

const Stock = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">("in");

  const [form, setForm] = useState({
    product_id: "",
    quantity: 1,
    reason: "",
  });

  const fetchData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);

    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, category, stock, stock_alert_threshold")
        .eq("store_id", storeId)
        .order("name"),
      supabase
        .from("stock_movements" as never)
        .select("*, products(name)")
        .eq("store_id" as never, storeId as never)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    setProducts((prods as unknown as Product[]) || []);
    setMovements(
      ((movs as unknown as (Movement & { products?: { name?: string } })[]) || []).map((m) => ({
        ...m,
        product_name: m.products?.name ?? "(produit supprimé)",
      }))
    );
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openMovement = (type: "in" | "out" | "adjustment") => {
    setMovementType(type);
    setForm({ product_id: "", quantity: 1, reason: "" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!storeId || !form.product_id || form.quantity <= 0) return;

    const product = products.find((p) => p.id === form.product_id);
    if (!product) return;

    let newStock = product.stock;
    if (movementType === "in") newStock += form.quantity;
    else if (movementType === "out") newStock = Math.max(0, newStock - form.quantity);
    else if (movementType === "adjustment") newStock = form.quantity;

    const delta = movementType === "adjustment" ? form.quantity - product.stock : form.quantity;

    // Create movement record
    const { error: movError } = await supabase.from("stock_movements" as never).insert({
      store_id: storeId,
      product_id: form.product_id,
      type: movementType,
      quantity: Math.abs(delta),
      reason: form.reason || null,
      created_by: user?.id ?? null,
    } as never);

    if (movError) {
      toast({ title: "Erreur", description: movError.message, variant: "destructive" });
      return;
    }

    // Update product stock
    const { error: prodError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", form.product_id);

    if (prodError) {
      toast({ title: "Erreur", description: prodError.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Mouvement enregistré",
      description: `${product.name} : ${product.stock} → ${newStock}`,
    });
    setDialogOpen(false);
    fetchData();
  };

  if (loading) {
    return (
      <DashboardLayout title="Gestion de stock">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  const lowStock = products.filter(
    (p) => (p.stock_alert_threshold ?? 0) > 0 && p.stock <= (p.stock_alert_threshold ?? 0)
  );
  const outOfStock = products.filter((p) => p.stock === 0);

  return (
    <DashboardLayout
      title="Gestion de stock"
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => openMovement("in")} className="gap-2">
            <ArrowDownToLine size={14} className="text-accent" /> Entrée
          </Button>
          <Button size="sm" variant="outline" onClick={() => openMovement("out")} className="gap-2">
            <ArrowUpFromLine size={14} className="text-destructive" /> Sortie
          </Button>
          <Button size="sm" onClick={() => openMovement("adjustment")} className="gap-2">
            <RefreshCcw size={14} /> Ajuster
          </Button>
        </div>
      }
    >
      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="text-destructive" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive font-[Space_Grotesk]">
                  {outOfStock.length}
                </p>
                <p className="text-xs text-muted-foreground">en rupture</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[hsl(38,95%,55%)]/30 bg-[hsl(38,95%,55%)]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(38,95%,55%)]/10 flex items-center justify-center">
                <AlertTriangle className="text-[hsl(38,95%,55%)]" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(38,95%,55%)] font-[Space_Grotesk]">
                  {lowStock.length}
                </p>
                <p className="text-xs text-muted-foreground">stock faible</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Package className="text-accent" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent font-[Space_Grotesk]">
                  {products.reduce((s, p) => s + p.stock, 0)}
                </p>
                <p className="text-xs text-muted-foreground">unités totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">État du stock</TabsTrigger>
          <TabsTrigger value="movements">
            <History size={14} className="mr-1.5" />
            Historique mouvements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 mt-4">
          {products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border/60 rounded-xl">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p>Aucun produit dans votre catalogue</p>
              <p className="text-sm">Créez d'abord un produit dans la page Produits.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Seuil alerte</TableHead>
                    <TableHead>État</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const isOut = p.stock === 0;
                    const isLow =
                      !isOut &&
                      (p.stock_alert_threshold ?? 0) > 0 &&
                      p.stock <= (p.stock_alert_threshold ?? 0);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.category ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {p.stock}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {p.stock_alert_threshold ?? "—"}
                        </TableCell>
                        <TableCell>
                          {isOut ? (
                            <Badge variant="destructive">Rupture</Badge>
                          ) : isLow ? (
                            <Badge className="bg-[hsl(38,95%,55%)]/10 text-[hsl(38,95%,55%)] border-[hsl(38,95%,55%)]/30">
                              Stock faible
                            </Badge>
                          ) : (
                            <Badge className="bg-accent/10 text-accent border-accent/30">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="flex justify-end mb-3">
            <ExportButton
              data={movements.map((m) => ({
                date: new Date(m.created_at).toLocaleString("fr-FR"),
                product: m.product_name,
                type: TYPE_CONFIG[m.type].label,
                quantity: m.quantity,
                reason: m.reason ?? "",
              }))}
              columns={[
                { key: "date", label: "Date" },
                { key: "product", label: "Produit" },
                { key: "type", label: "Type" },
                { key: "quantity", label: "Quantité" },
                { key: "reason", label: "Raison" },
              ]}
              filename="mouvements-stock"
            />
          </div>

          {movements.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border/60 rounded-xl">
              <History size={48} className="mx-auto mb-3 opacity-30" />
              <p>Aucun mouvement enregistré</p>
              <p className="text-sm">Cliquez sur "Entrée" ou "Sortie" pour commencer.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead>Raison</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => {
                    const cfg = TYPE_CONFIG[m.type];
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(m.created_at).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="font-medium">{m.product_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${cfg.color} text-xs gap-1`}>
                            <Icon size={11} />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {m.type === "out" || m.type === "sale" ? "-" : "+"}
                          {m.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.reason ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === "in"
                ? "Entrée de stock"
                : movementType === "out"
                ? "Sortie de stock"
                : "Ajustement de stock"}
            </DialogTitle>
            <DialogDescription>
              {movementType === "in"
                ? "Ajout de produits au stock (réception fournisseur, retour client...)"
                : movementType === "out"
                ? "Retrait du stock (perte, casse, prélèvement...)"
                : "Définir directement la nouvelle quantité en stock."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Produit</Label>
              <Select
                value={form.product_id}
                onValueChange={(v) => setForm({ ...form, product_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (stock: {p.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="qty">
                {movementType === "adjustment" ? "Nouveau stock total" : "Quantité"}
              </Label>
              <Input
                id="qty"
                type="number"
                min={movementType === "adjustment" ? 0 : 1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Ex: Réception fournisseur n°123"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!form.product_id || form.quantity < 0}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Stock;
