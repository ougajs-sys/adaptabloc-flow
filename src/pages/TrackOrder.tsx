import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  Phone,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Search,
  Loader2,
  ShoppingBag,
  XCircle,
  Sparkles,
} from "lucide-react";

type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "shipping" | "delivered" | "cancelled";

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  custom_label: string | null;
  total_amount: number;
  shipping_address: string | null;
  shipping_city: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  store_name: string;
  items: { name: string; quantity: number; unit_price: number }[];
}

const stages: { id: OrderStatus; label: string; icon: typeof Package; description: string }[] = [
  { id: "new", label: "Reçue", icon: ShoppingBag, description: "Votre commande a été reçue" },
  { id: "confirmed", label: "Confirmée", icon: Phone, description: "Confirmée par téléphone" },
  { id: "preparing", label: "En préparation", icon: Package, description: "Votre colis est en cours de préparation" },
  { id: "ready", label: "Prête", icon: CheckCircle2, description: "Prête à être expédiée" },
  { id: "shipping", label: "En route", icon: Truck, description: "Le livreur est en route" },
  { id: "delivered", label: "Livrée", icon: CheckCircle2, description: "Commande livrée et payée" },
];

function statusIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return stages.findIndex((s) => s.id === status);
}

const TrackOrder = () => {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "order_number, status, total_amount, shipping_address, shipping_city, created_at, updated_at, customers(name), stores(name), order_items(product_name, quantity, unit_price)"
        )
        .eq("tracking_token" as never, token as never)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const customLabel = (data as Record<string, unknown>).custom_label;
      const d = data as unknown as {
        order_number: string;
        status: OrderStatus;
        total_amount: number;
        shipping_address: string | null;
        shipping_city: string | null;
        created_at: string;
        updated_at: string;
        customers?: { name?: string } | null;
        stores?: { name?: string } | null;
        order_items?: { product_name: string; quantity: number; unit_price: number }[];
      };

      setOrder({
        order_number: d.order_number,
        status: d.status,
        custom_label: typeof customLabel === "string" ? customLabel : null,
        total_amount: d.total_amount,
        shipping_address: d.shipping_address,
        shipping_city: d.shipping_city,
        created_at: d.created_at,
        updated_at: d.updated_at,
        customer_name: d.customers?.name ?? "Client",
        store_name: d.stores?.name ?? "Boutique",
        items: (d.order_items ?? []).map((it) => ({
          name: it.product_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });
      setLoading(false);
    };

    fetchOrder();

    // Realtime subscription
    const channel = supabase
      .channel(`order-track-${token}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `tracking_token=eq.${token}` },
        () => fetchOrder()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Search className="text-destructive" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
            Commande introuvable
          </h1>
          <p className="text-muted-foreground">
            Le lien de suivi est invalide ou a expiré. Contactez votre vendeur pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  const currentStep = statusIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold mb-3">
            <Sparkles size={12} />
            Suivi en temps réel
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[Space_Grotesk]">
            Bonjour {order.customer_name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici le statut de votre commande chez{" "}
            <span className="font-semibold text-foreground">{order.store_name}</span>
          </p>
        </div>

        {/* Order summary */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Numéro de commande</p>
              <p className="text-lg font-bold font-[Space_Grotesk] text-foreground">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold font-[Space_Grotesk] text-foreground">
                {order.total_amount.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          </div>

          {order.custom_label && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary font-medium mb-3">
              {order.custom_label}
            </div>
          )}

          {order.shipping_address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>
                {order.shipping_address}
                {order.shipping_city ? `, ${order.shipping_city}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Status timeline */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-4">Suivi de la commande</h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/30 p-4">
              <XCircle className="text-destructive shrink-0" size={24} />
              <div>
                <p className="font-semibold text-destructive">Commande annulée</p>
                <p className="text-sm text-muted-foreground">
                  Cette commande a été annulée. Contactez votre vendeur pour plus d'informations.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage, i) => {
                const isComplete = i < currentStep;
                const isCurrent = i === currentStep;
                const isPending = i > currentStep;
                const Icon = stage.icon;

                return (
                  <div key={stage.id} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isComplete
                            ? "bg-accent text-accent-foreground"
                            : isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                      </div>
                      {i < stages.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            isComplete ? "bg-accent" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p
                        className={`text-sm font-bold ${
                          isCurrent
                            ? "text-primary"
                            : isComplete
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stage.label}
                        {isCurrent && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                            <Clock size={10} />
                            En cours
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-xs ${
                          isPending ? "text-muted-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Items list */}
        {order.items.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 shadow-sm">
            <h2 className="text-base font-bold text-foreground mb-3">Articles ({order.items.length})</h2>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      {item.quantity}×
                    </span>
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {(item.unit_price * item.quantity).toLocaleString("fr-FR")} F
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Mis à jour le {new Date(order.updated_at).toLocaleString("fr-FR")} ·{" "}
          <span className="text-primary">Propulsé par Intramate</span>
        </p>
      </div>
    </div>
  );
};

export default TrackOrder;
