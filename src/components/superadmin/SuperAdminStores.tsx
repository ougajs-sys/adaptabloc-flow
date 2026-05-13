import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { modulesRegistry, FREE_MODULE_IDS, getModuleById } from "@/lib/modules-registry";
import { Loader2 } from "lucide-react";

interface StoreRow {
  id: string;
  name: string;
  sector: string | null;
  country: string | null;
  created_at: string;
  owner_id: string;
}

const PAID_MODULES = modulesRegistry.filter((m) => !FREE_MODULE_IDS.includes(m.id) && m.available);

export default function SuperAdminStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeModules, setStoreModules] = useState<Record<string, string[]>>({});
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [storesRes, modulesRes] = await Promise.all([
        supabase.from("stores").select("id, name, sector, country, created_at, owner_id"),
        supabase.from("store_modules").select("store_id, module_id"),
      ]);
      setStores(storesRes.data || []);
      const map: Record<string, string[]> = {};
      (modulesRes.data || []).forEach((m) => {
        if (!map[m.store_id]) map[m.store_id] = [];
        map[m.store_id].push(m.module_id);
      });
      setStoreModules(map);
      setLoading(false);
    }
    load();
  }, []);

  const toggleModule = async (storeId: string, moduleId: string, isActive: boolean) => {
    setToggling(moduleId);
    try {
      if (isActive) {
        const { error } = await supabase
          .from("store_modules")
          .delete()
          .eq("store_id", storeId)
          .eq("module_id", moduleId);
        if (error) throw error;
        setStoreModules((prev) => ({
          ...prev,
          [storeId]: (prev[storeId] || []).filter((m) => m !== moduleId),
        }));
        toast({ title: `Module désactivé`, description: getModuleById(moduleId)?.name });
      } else {
        const { error } = await supabase
          .from("store_modules")
          .insert({ store_id: storeId, module_id: moduleId });
        if (error && error.code !== "23505") throw error;
        setStoreModules((prev) => ({
          ...prev,
          [storeId]: [...new Set([...(prev[storeId] || []), moduleId])],
        }));
        toast({ title: `Module activé`, description: getModuleById(moduleId)?.name });
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  const selectedModules = selectedStore ? (storeModules[selectedStore.id] || []) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Toutes les boutiques ({stores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.sector || "—"}</TableCell>
                  <TableCell>{s.country || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{(storeModules[s.id] || []).length} actifs</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStore(s)}>
                      Gérer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStore?.name} — Modules</DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground border rounded-lg p-3 bg-muted/30">
                <p><strong className="text-foreground">Secteur :</strong> {selectedStore.sector || "Non défini"}</p>
                <p><strong className="text-foreground">Pays :</strong> {selectedStore.country || "Non défini"}</p>
                <p><strong className="text-foreground">Inscrit le :</strong> {new Date(selectedStore.created_at).toLocaleDateString("fr-FR")}</p>
                <p><strong className="text-foreground">Modules payants :</strong> {selectedModules.length}</p>
              </div>

              <div className="space-y-2">
                {PAID_MODULES.map((mod) => {
                  const isActive = selectedModules.includes(mod.id);
                  const isToggling = toggling === mod.id;
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isActive ? "border-primary/30 bg-primary/5" : "border-border/50"
                      }`}
                    >
                      <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-md ${isActive ? "bg-primary/15" : "bg-muted"}`}>
                        <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{mod.name}</p>
                        <p className="text-xs text-muted-foreground">{mod.price.toLocaleString("fr-FR")} FCFA/mois · {mod.tier.toUpperCase()}</p>
                      </div>
                      {isToggling ? (
                        <Loader2 size={16} className="animate-spin text-muted-foreground shrink-0" />
                      ) : (
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleModule(selectedStore.id, mod.id, isActive)}
                          className="shrink-0"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
