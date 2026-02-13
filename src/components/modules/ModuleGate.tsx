import { useModules } from "@/contexts/ModulesContext";
import { UpgradePrompt } from "./UpgradePrompt";
import type { ReactNode } from "react";

interface ModuleGateProps {
  moduleId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ModuleGate({ moduleId, children, fallback }: ModuleGateProps) {
  const { hasModule } = useModules();

  if (hasModule(moduleId)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <UpgradePrompt moduleId={moduleId} />}</>;
}
