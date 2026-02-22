import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface StoreRow {
  id: string;
  name: string;
  sector: string | null;
  country: string | null;
  created_at: string;
  owner_id: string;
}

export default function SuperAdminStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeModules, setStoreModules] = useState<Record<string, string[]>>({});
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
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

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

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
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedStore?.name}</DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-3 text-sm">
              <p><strong>Secteur :</strong> {selectedStore.sector || "Non défini"}</p>
              <p><strong>Pays :</strong> {selectedStore.country || "Non défini"}</p>
              <p><strong>Inscrit le :</strong> {new Date(selectedStore.created_at).toLocaleDateString("fr-FR")}</p>
              <p><strong>Modules actifs :</strong></p>
              <div className="flex flex-wrap gap-1">
                {(storeModules[selectedStore.id] || []).map((m) => (
                  <Badge key={m} variant="outline">{m}</Badge>
                ))}
                {(storeModules[selectedStore.id] || []).length === 0 && (
                  <span className="text-muted-foreground">Aucun module payant</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
