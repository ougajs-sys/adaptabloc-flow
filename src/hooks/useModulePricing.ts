import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches module pricing overrides from the DB (module_pricing table).
 * Returns a map of module_id → price (FCFA).
 * Falls back to empty map if no overrides exist.
 */
export function useModulePricing() {
  return useQuery({
    queryKey: ["module-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_pricing")
        .select("module_id, price");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data || []) {
        map[row.module_id] = row.price;
      }
      return map;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
