import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { FREE_MODULE_IDS, getModuleById, calculateMonthlyPrice, type ModuleDefinition } from "@/lib/modules-registry";

const STORAGE_KEY = "easyflow_active_modules";

interface ModulesContextValue {
  activeModules: string[];
  hasModule: (id: string) => boolean;
  isFeatureEnabled: (feature: string) => boolean;
  activateModule: (id: string) => void;
  deactivateModule: (id: string) => void;
  setModules: (ids: string[]) => void;
  monthlyPrice: number;
}

const ModulesContext = createContext<ModulesContextValue | null>(null);

function loadModules(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      // Always include free modules
      return [...new Set([...FREE_MODULE_IDS, ...parsed])];
    }
  } catch { /* ignore */ }
  return [...FREE_MODULE_IDS];
}

function saveModules(ids: string[]) {
  // Only persist non-free modules
  const nonFree = ids.filter((id) => !FREE_MODULE_IDS.includes(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nonFree));
}

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [activeModules, setActiveModules] = useState<string[]>(loadModules);

  useEffect(() => {
    saveModules(activeModules);
  }, [activeModules]);

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

  const activateModule = useCallback((id: string) => {
    setActiveModules((prev) => [...new Set([...prev, id])]);
  }, []);

  const deactivateModule = useCallback((id: string) => {
    if (FREE_MODULE_IDS.includes(id)) return; // Can't deactivate free modules
    setActiveModules((prev) => prev.filter((m) => m !== id));
  }, []);

  const setModules = useCallback((ids: string[]) => {
    setActiveModules([...new Set([...FREE_MODULE_IDS, ...ids])]);
  }, []);

  const monthlyPrice = calculateMonthlyPrice(activeModules);

  return (
    <ModulesContext.Provider
      value={{ activeModules, hasModule, isFeatureEnabled, activateModule, deactivateModule, setModules, monthlyPrice }}
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
