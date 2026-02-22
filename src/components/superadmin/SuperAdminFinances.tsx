import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

interface TransactionRow {
  id: string;
  store_id: string;
  gross_amount: number;
  net_amount: number;
  fee_amount: number;
  currency: string;
  provider: string;
  country: string | null;
  status: string;
  created_at: string;
}

export default function SuperAdminFinances() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [txRes, storesRes] = await Promise.all([
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("stores").select("id, name"),
      ]);
      setTransactions((txRes.data as TransactionRow[]) || []);
      const names: Record<string, string> = {};
      (storesRes.data || []).forEach((s) => { names[s.id] = s.name; });
      setStoreNames(names);
      setLoading(false);
    }
    load();
  }, []);

  const exportCSV = () => {
    const header = "Date,Boutique,Pays,Montant Brut,Montant Net,Frais,Devise,Provider,Statut\n";
    const rows = transactions.map((t) =>
      `${new Date(t.created_at).toLocaleDateString("fr-FR")},${storeNames[t.store_id] || t.store_id},${t.country || ""},${t.gross_amount},${t.net_amount},${t.fee_amount},${t.currency},${t.provider},${t.status}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Revenue by provider
  const revenueByProvider: Record<string, number> = {};
  transactions.filter((t) => t.status === "completed").forEach((t) => {
    revenueByProvider[t.provider] = (revenueByProvider[t.provider] || 0) + t.net_amount;
  });

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Transactions</h2>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {Object.keys(revenueByProvider).length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(revenueByProvider).map(([provider, amount]) => (
            <Card key={provider}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium capitalize">{provider}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{amount.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">Revenu net</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Brut</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune transaction</TableCell></TableRow>
              ) : transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{new Date(t.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="font-medium">{storeNames[t.store_id] || "—"}</TableCell>
                  <TableCell className="capitalize">{t.provider}</TableCell>
                  <TableCell>{t.gross_amount.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">{t.fee_amount.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{t.net_amount.toLocaleString()}</TableCell>
                  <TableCell>{t.currency}</TableCell>
                  <TableCell><Badge variant={t.status === "completed" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
