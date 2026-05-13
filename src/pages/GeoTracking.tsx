import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useNavigate } from "react-router-dom";
import {
  Lock, Loader2, MapPin, Navigation, Users, Truck,
  RefreshCw, Clock, Wifi, WifiOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy_m: number | null;
  speed_kmh: number | null;
  is_on_duty: boolean;
  updated_at: string;
  driver_name?: string;
}

interface PendingDelivery {
  id: string;
  order_id: string;
  driver_id: string | null;
  address: string | null;
  customer_name: string | null;
  status: string;
}

// ── Staleness helper ───────────────────────────────────────────────────────────

function isStale(updatedAt: string, thresholdMs = 5 * 60 * 1000): boolean {
  return Date.now() - new Date(updatedAt).getTime() > thresholdMs;
}

// ── Map component (Leaflet) ───────────────────────────────────────────────────

function LiveMap({ drivers }: { drivers: DriverLocation[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon paths (common Vite/webpack issue)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([6.3654, 2.4183], 12); // Default: Cotonou
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      mapInstance.current = map;
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    if (!mapInstance.current) return;
    import("leaflet").then((L) => {
      const bounds: [number, number][] = [];

      drivers.forEach((d) => {
        const stale = isStale(d.updated_at);
        const color = !d.is_on_duty ? "#9ca3af" : stale ? "#f59e0b" : "#10b981";

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:36px;height:36px;border-radius:50%;
            background:${color};border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:16px;font-weight:bold;
          ">🚚</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        if (markers.current[d.driver_id]) {
          markers.current[d.driver_id]
            .setLatLng([d.latitude, d.longitude])
            .setIcon(icon)
            .getPopup()
            ?.setContent(popupContent(d));
        } else {
          const marker = L.marker([d.latitude, d.longitude], { icon })
            .addTo(mapInstance.current)
            .bindPopup(popupContent(d));
          markers.current[d.driver_id] = marker;
        }
        bounds.push([d.latitude, d.longitude]);
      });

      // Remove markers for drivers no longer in list
      Object.keys(markers.current).forEach((id) => {
        if (!drivers.find((d) => d.driver_id === id)) {
          markers.current[id].remove();
          delete markers.current[id];
        }
      });

      if (bounds.length > 0) {
        mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    });
  }, [drivers]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-lg overflow-hidden border border-border/60"
      style={{ height: "420px" }}
    />
  );
}

function popupContent(d: DriverLocation): string {
  return `
    <div style="font-family:sans-serif;font-size:13px;line-height:1.5">
      <strong>${d.driver_name || "Livreur"}</strong><br/>
      ${d.is_on_duty ? "🟢 En service" : "⚫ Hors service"}<br/>
      ${d.speed_kmh != null ? `🚀 ${Math.round(d.speed_kmh)} km/h<br/>` : ""}
      🕐 ${new Date(d.updated_at).toLocaleTimeString("fr-FR")}
    </div>
  `;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GeoTracking() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const navigate = useNavigate();

  const moduleEnabled = hasModule("geo_tracking");

  const { data: locations = [], isLoading, dataUpdatedAt, refetch } = useQuery<DriverLocation[]>({
    queryKey: ["driver-locations", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("driver_locations" as any) as any)
        .select("driver_id, latitude, longitude, accuracy_m, speed_kmh, is_on_duty, updated_at")
        .eq("store_id", storeId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const ids: string[] = (data || []).map((d: any) => d.driver_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] };

      return (data || []).map((d: any) => ({
        ...d,
        driver_name: (profiles || []).find((p: any) => p.id === d.driver_id)?.full_name || "Livreur",
      })) as DriverLocation[];
    },
    refetchInterval: 15_000,
  });

  const activeDrivers = locations.filter((d) => d.is_on_duty && !isStale(d.updated_at, 10 * 60 * 1000));
  const staleDrivers = locations.filter((d) => d.is_on_duty && isStale(d.updated_at, 10 * 60 * 1000));

  if (modulesLoading) {
    return <DashboardLayout title="Géolocalisation"><p className="text-sm text-muted-foreground">Chargement...</p></DashboardLayout>;
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Géolocalisation" subtitle="Module Géolocalisation temps réel">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Géolocalisation temps réel</span> pour suivre vos livreurs sur une carte en direct.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Géolocalisation"
      subtitle="Suivez vos livreurs en temps réel"
    >
      <div className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wifi size={14} className="text-emerald-500" />
                <p className="text-xs text-muted-foreground">En ligne</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-emerald-500">{activeDrivers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <WifiOff size={14} className="text-amber-500" />
                <p className="text-xs text-muted-foreground">Inactifs</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-amber-500">{staleDrivers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users size={14} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total suivi</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk]">{locations.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-[Space_Grotesk] flex items-center gap-2">
                <MapPin size={16} className="text-emerald-500" />
                Carte en direct
              </CardTitle>
              <div className="flex items-center gap-3">
                {dataUpdatedAt > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    MAJ {formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: fr })}
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && locations.length === 0 ? (
              <div className="flex items-center justify-center h-[420px] bg-muted/30 rounded-lg">
                <Loader2 className="animate-spin text-muted-foreground" size={28} />
              </div>
            ) : locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[420px] bg-muted/30 rounded-lg text-muted-foreground">
                <Truck size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Aucun livreur ne partage sa position.</p>
                <p className="text-xs mt-1">Les livreurs doivent activer le partage depuis leur espace de travail.</p>
              </div>
            ) : (
              <LiveMap drivers={locations} />
            )}
          </CardContent>
        </Card>

        {/* Driver list */}
        {locations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-[Space_Grotesk]">Détail des livreurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {locations.map((d) => {
                const stale = isStale(d.updated_at, 10 * 60 * 1000);
                return (
                  <div key={d.driver_id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      !d.is_on_duty ? "bg-slate-400" : stale ? "bg-amber-500" : "bg-emerald-500"
                    }`}>
                      🚚
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{d.driver_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.latitude.toFixed(5)}, {d.longitude.toFixed(5)}
                        {d.speed_kmh != null && ` · ${Math.round(d.speed_kmh)} km/h`}
                        {d.accuracy_m != null && ` · ±${Math.round(d.accuracy_m)}m`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant={!d.is_on_duty ? "secondary" : stale ? "outline" : "default"}
                        className="text-[10px] mb-1"
                      >
                        {!d.is_on_duty ? "Hors service" : stale ? "Inactif" : "En ligne"}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(d.updated_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${d.latitude},${d.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Navigation size={14} />
                      </Button>
                    </a>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
