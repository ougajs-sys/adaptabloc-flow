import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Store, CreditCard, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: "store" | "payment" | "ticket";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const ICON_MAP = {
  store: Store,
  payment: CreditCard,
  ticket: Ticket,
};

const COLOR_MAP = {
  store: "text-emerald-500",
  payment: "text-primary",
  ticket: "text-amber-500",
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const addNotification = useCallback((n: Omit<Notification, "read">) => {
    if (seenIdsRef.current.has(n.id)) return;
    seenIdsRef.current.add(n.id);
    setNotifications((prev) => [{ ...n, read: false }, ...prev].slice(0, 50));
  }, []);

  // Load recent events on mount
  useEffect(() => {
    async function loadRecent() {
      const since = new Date();
      since.setHours(since.getHours() - 24);
      const sinceISO = since.toISOString();

      const [storesRes, txnRes, ticketsRes] = await Promise.all([
        supabase.from("stores").select("id, name, created_at").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(10),
        supabase.from("transactions").select("id, gross_amount, currency, status, provider, created_at").gte("created_at", sinceISO).eq("status", "completed").order("created_at", { ascending: false }).limit(10),
        supabase.from("support_tickets").select("id, subject, created_at").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(10),
      ]);

      const initial: Notification[] = [];

      (storesRes.data || []).forEach((s: any) => {
        const id = `store-${s.id}`;
        seenIdsRef.current.add(id);
        initial.push({ id, type: "store", title: "Nouvelle boutique", description: s.name, time: s.created_at, read: true });
      });

      (txnRes.data || []).forEach((t: any) => {
        const id = `txn-${t.id}`;
        seenIdsRef.current.add(id);
        initial.push({ id, type: "payment", title: "Paiement reçu", description: `${t.gross_amount.toLocaleString()} ${t.currency} via ${t.provider}`, time: t.created_at, read: true });
      });

      (ticketsRes.data || []).forEach((t: any) => {
        const id = `ticket-${t.id}`;
        seenIdsRef.current.add(id);
        initial.push({ id, type: "ticket", title: "Nouveau ticket", description: t.subject, time: t.created_at, read: true });
      });

      initial.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(initial.slice(0, 50));
    }
    loadRecent();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "stores" }, (payload) => {
        const s = payload.new as any;
        addNotification({ id: `store-${s.id}`, type: "store", title: "Nouvelle boutique", description: s.name, time: s.created_at });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions" }, (payload) => {
        const t = payload.new as any;
        if (t.status === "completed") {
          addNotification({ id: `txn-${t.id}`, type: "payment", title: "Paiement confirmé", description: `${t.gross_amount?.toLocaleString()} ${t.currency}`, time: t.created_at });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, (payload) => {
        const t = payload.new as any;
        if (t.status === "completed") {
          addNotification({ id: `txn-${t.id}`, type: "payment", title: "Paiement reçu", description: `${t.gross_amount?.toLocaleString()} ${t.currency}`, time: t.created_at });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, (payload) => {
        const t = payload.new as any;
        addNotification({ id: `ticket-${t.id}`, type: "ticket", title: "Nouveau ticket", description: t.subject, time: t.created_at });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {notifications.length > 0 && (
            <button onClick={() => setNotifications([])} className="text-xs text-muted-foreground hover:text-foreground">
              Tout effacer
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune notification</p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const Icon = ICON_MAP[n.type];
                return (
                  <div key={n.id} className={`flex gap-3 px-4 py-3 text-sm ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-0.5 shrink-0 ${COLOR_MAP[n.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(n.time), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <button onClick={() => dismiss(n.id)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
