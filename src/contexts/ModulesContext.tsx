import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { FREE_MODULE_IDS, getModuleById, calculateMonthlyPrice } from "@/lib/modules-registry";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ModulesContextValue {
  activeModules: string[];
  hasModule: (id: string) => boolean;
  isFeatureEnabled: (feature: string) => boolean;
  activateModule: (id: string) => void;
  deactivateModule: (id: string) => void;
  setModules: (ids: string[]) => void;
  monthlyPrice: number;
  isLoading: boolean;
}

const ModulesContext = createContext<ModulesContextValue | null>(null);

export function ModulesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const [paidModules, setPaidModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeModules = [...new Set([...FREE_MODULE_IDS, ...paidModules])];

  // Fetch modules from DB when store changes
  useEffect(() => {
    if (!storeId) {
      setPaidModules([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchModules = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("store_modules")
        .select("module_id")
        .eq("store_id", storeId);

      if (!cancelled) {
        if (!error && data) {
          setPaidModules(data.map((r) => r.module_id));
        }
        setIsLoading(false);
      }
    };

    fetchModules();

    // Realtime subscription for cross-tab/device sync
    const channel = supabase
      .channel(`store_modules_${storeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_modules", filter: `store_id=eq.${storeId}` },
        () => { fetchModules(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const hasModule = useCallback(
    (id: string) => activeModules.includes(id),
    [activeModules]
  );

  const isFeatureEnabled = useCallback(
    (feature: string) => {
      return activeModules.some((id) => {
        const mod = getModuleById(id);
        return mod?.features.includes(feature);
      });
    },
    [activeModules]
  );

  const activateModule = useCallback(
    async (id: string) => {
      if (!storeId || FREE_MODULE_IDS.includes(id)) return;
      // Optimistic update
      setPaidModules((prev) => [...new Set([...prev, id])]);
      const { error } = await supabase
        .from("store_modules")
        .insert({ store_id: storeId, module_id: id });
      if (error && !error.message.includes("duplicate")) {
        // Revert on error
        setPaidModules((prev) => prev.filter((m) => m !== id));
      }
    },
    [storeId]
  );

  const deactivateModule = useCallback(
    async (id: string) => {
      if (!storeId || FREE_MODULE_IDS.includes(id)) return;
      // Optimistic update
      setPaidModules((prev) => prev.filter((m) => m !== id));
      const { error } = await supabase
        .from("store_modules")
        .delete()
        .eq("store_id", storeId)
        .eq("module_id", id);
      if (error) {
        // Revert on error
        setPaidModules((prev) => [...new Set([...prev, id])]);
      }
    },
    [storeId]
  );

  const setModules = useCallback(
    async (ids: string[]) => {
      if (!storeId) return;
      const nonFree = ids.filter((id) => !FREE_MODULE_IDS.includes(id));
      setPaidModules(nonFree);

      // Delete all existing, then insert new ones
      await supabase.from("store_modules").delete().eq("store_id", storeId);
      if (nonFree.length > 0) {
        await supabase
          .from("store_modules")
          .insert(nonFree.map((module_id) => ({ store_id: storeId, module_id })));
      }
    },
    [storeId]
  );

  const monthlyPrice = calculateMonthlyPrice(activeModules);

  return (
    <ModulesContext.Provider
      value={{ activeModules, hasModule, isFeatureEnabled, activateModule, deactivateModule, setModules, monthlyPrice, isLoading }}
    >
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules() {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error("useModules must be used within ModulesProvider");
  return ctx;
}
