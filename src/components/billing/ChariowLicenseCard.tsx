import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Copy, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function ChariowLicenseCard() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);

  const { data: license, isLoading } = useQuery({
    queryKey: ["chariow-license", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      // Cast: chariow_* columns added in 20260506000000_chariow_integration.sql.
      // Generated types refresh after the migration is deployed.
      const { data, error } = await (supabase.from("subscriptions") as any)
        .select(
          "chariow_license_key, chariow_product_id, chariow_activated_at, chariow_last_validated_at, status, renewal_date, provider"
        )
        .eq("store_id", storeId!)
        .not("chariow_license_key", "is", null)
        .order("chariow_activated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as {
        chariow_license_key: string | null;
        chariow_product_id: string | null;
        chariow_activated_at: string | null;
        chariow_last_validated_at: string | null;
        status: string;
        renewal_date: string | null;
        provider: string | null;
      } | null;
    },
  });

  if (isLoading || !license?.chariow_license_key) return null;

  const masked = license.chariow_license_key.replace(/.(?=.{4})/g, "•");

  const copyKey = async () => {
    await navigator.clipboard.writeText(license.chariow_license_key!);
    toast({ title: "Clé copiée", description: "La clé de licence a été copiée dans le presse-papiers." });
  };

  const statusBadge =
    license.status === "active"
      ? { label: "Active", variant: "default" as const, icon: CheckCircle2 }
      : license.status === "grace"
        ? { label: "Période de grâce", variant: "secondary" as const, icon: Clock }
        : { label: "Expirée", variant: "destructive" as const, icon: Clock };

  const StatusIcon = statusBadge.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-transparent overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <KeyRound size={20} className="text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Licence Chariow
                  <Badge variant={statusBadge.variant} className="gap-1 text-xs">
                    <StatusIcon size={10} /> {statusBadge.label}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Activée le{" "}
                  {license.chariow_activated_at
                    ? new Date(license.chariow_activated_at).toLocaleDateString("fr-FR")
                    : "—"}
                </CardDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="text-emerald-500" />
              {license.chariow_last_validated_at
                ? `Vérifiée ${new Date(license.chariow_last_validated_at).toLocaleDateString("fr-FR")}`
                : "Non vérifiée"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2.5 font-mono text-sm">
            <span className="flex-1 truncate">
              {revealed ? license.chariow_license_key : masked}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRevealed((r) => !r)}
            >
              {revealed ? "Masquer" : "Afficher"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copyKey}>
              <Copy size={14} />
            </Button>
          </div>
          {license.renewal_date && (
            <p className="text-xs text-muted-foreground mt-2">
              Prochain renouvellement :{" "}
              <span className="font-medium text-foreground">
                {new Date(license.renewal_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
