import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  api_key: string | null;
  secret_key: string | null;
  fee_percentage: number;
  markets: string[];
  supported_methods: string[];
}

export default function SuperAdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("payment_providers").select("*");
      setProviders((data as Provider[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const updateProvider = async (id: string, updates: Partial<Provider>) => {
    setSaving(id);
    const { error } = await supabase.from("payment_providers").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      toast({ title: "Mis à jour !" });
    }
    setSaving(null);
  };

  const toggleActive = (p: Provider) => {
    // Require API keys before activating
    if (!p.is_active && (!p.api_key || !p.secret_key)) {
      toast({
        title: "Clés manquantes",
        description: "Renseignez les clés API et secrète avant d'activer ce provider.",
        variant: "destructive",
      });
      return;
    }
    updateProvider(p.id, { is_active: !p.is_active });
  };

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Providers de paiement</h2>

      {providers.map((p) => (
        <Card key={p.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{p.display_name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Frais : {p.fee_percentage}% — Marchés : {p.markets.join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.is_active ? "default" : "secondary"}>
                {p.is_active ? "Actif" : "Inactif"}
              </Badge>
              <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Clé API</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Clé API..."
                    value={p.api_key || ""}
                    onChange={(e) => setProviders((prev) => prev.map((x) => x.id === p.id ? { ...x, api_key: e.target.value } : x))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Clé Secrète</label>
                <Input
                  type="password"
                  placeholder="Clé secrète..."
                  value={p.secret_key || ""}
                  onChange={(e) => setProviders((prev) => prev.map((x) => x.id === p.id ? { ...x, secret_key: e.target.value } : x))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <p className="text-xs text-muted-foreground flex-1">
                Méthodes : {p.supported_methods.join(", ")}
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={saving === p.id}
                onClick={() => updateProvider(p.id, { api_key: p.api_key, secret_key: p.secret_key })}
              >
                <Save className="h-3.5 w-3.5 mr-1" /> Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
