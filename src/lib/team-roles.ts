import { type LucideIcon } from "lucide-react";
import { Phone, PackageCheck, Truck, Shield } from "lucide-react";

// ── Role definitions ──────────────────────────────────────────────

export type TeamRole = "admin" | "caller" | "preparateur" | "livreur";

export interface RoleDefinition {
  id: TeamRole;
  label: string;
  labelPlural: string;
  description: string;
  icon: LucideIcon;
  color: string; // tailwind text-* token
}

export const rolesRegistry: Record<TeamRole, RoleDefinition> = {
  admin: {
    id: "admin",
    label: "Admin",
    labelPlural: "Admins",
    description: "Gère la boutique, les modules et les paramètres.",
    icon: Shield,
    color: "text-primary",
  },
  caller: {
    id: "caller",
    label: "Caller",
    labelPlural: "Callers",
    description: "Contacte les clients, confirme les commandes et les adresses.",
    icon: Phone,
    color: "text-blue-500",
  },
  preparateur: {
    id: "preparateur",
    label: "Préparateur",
    labelPlural: "Préparateurs",
    description: "Prépare et emballe les colis avant expédition.",
    icon: PackageCheck,
    color: "text-amber-500",
  },
  livreur: {
    id: "livreur",
    label: "Livreur",
    labelPlural: "Livreurs",
    description: "Livre les commandes et collecte le paiement à la livraison.",
    icon: Truck,
    color: "text-emerald-500",
  },
};

// ── Order pipeline statuses ───────────────────────────────────────

export type OrderPipelineStatus =
  | "new"
  | "caller_pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "returned";

export interface PipelineStage {
  status: OrderPipelineStatus;
  label: string;
  shortLabel: string;
  responsibleRole: TeamRole | null;
  color: string;
}

export const pipelineStages: PipelineStage[] = [
  { status: "new", label: "Nouvelle commande", shortLabel: "Nouvelles", responsibleRole: null, color: "bg-muted" },
  { status: "caller_pending", label: "À confirmer", shortLabel: "Caller", responsibleRole: "caller", color: "bg-blue-500/15" },
  { status: "confirmed", label: "Confirmée", shortLabel: "Confirmées", responsibleRole: "caller", color: "bg-blue-500/25" },
  { status: "preparing", label: "En préparation", shortLabel: "Préparation", responsibleRole: "preparateur", color: "bg-amber-500/15" },
  { status: "ready", label: "Prête", shortLabel: "Prêtes", responsibleRole: "preparateur", color: "bg-amber-500/25" },
  { status: "in_transit", label: "En livraison", shortLabel: "Livraison", responsibleRole: "livreur", color: "bg-emerald-500/15" },
  { status: "delivered", label: "Livrée", shortLabel: "Livrées", responsibleRole: "livreur", color: "bg-emerald-500/25" },
  { status: "cancelled", label: "Annulée", shortLabel: "Annulées", responsibleRole: null, color: "bg-destructive/15" },
  { status: "returned", label: "Retournée", shortLabel: "Retours", responsibleRole: null, color: "bg-destructive/10" },
];

export function getStageByStatus(status: OrderPipelineStatus): PipelineStage {
  return pipelineStages.find((s) => s.status === status) ?? pipelineStages[0];
}

/** The main visible pipeline columns (excludes terminal states shown separately) */
export const kanbanColumns: OrderPipelineStatus[] = [
  "new",
  "caller_pending",
  "confirmed",
  "preparing",
  "ready",
  "in_transit",
  "delivered",
];

// ── Quota management ──────────────────────────────────────────────

export interface RoleQuota {
  role: TeamRole;
  base: number;       // included in free tier
  extra: number;      // added by modules
  unlimited: boolean; // tier2+ module gives unlimited
}

/**
 * Compute role quotas based on active module IDs.
 * This is the single source of truth for how many staff of each role are allowed.
 */
export function computeQuotas(activeModuleIds: string[]): RoleQuota[] {
  const has = (id: string) => activeModuleIds.includes(id);

  return [
    { role: "admin", base: 1, extra: 0, unlimited: false },
    {
      role: "caller",
      base: 1,
      extra: has("extra_callers") ? 3 : 0,
      unlimited: has("call_center"),
    },
    {
      role: "preparateur",
      base: 1,
      extra: has("extra_preparers") ? 3 : 0,
      unlimited: has("warehouse_team"),
    },
    {
      role: "livreur",
      base: 1,
      extra: has("extra_drivers") ? 3 : 0,
      unlimited: has("multi_delivery"),
    },
  ];
}

export function getMaxForRole(role: TeamRole, activeModuleIds: string[]): number | null {
  const quota = computeQuotas(activeModuleIds).find((q) => q.role === role);
  if (!quota) return 1;
  if (quota.unlimited) return null; // unlimited
  return quota.base + quota.extra;
}

// ── Team member type ──────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: TeamRole;
  avatar?: string;
  ordersHandled: number;
  status: "active" | "inactive";
}

// ── Mock data ─────────────────────────────────────────────────────

export const mockTeamMembers: TeamMember[] = [
  { id: "tm-1", name: "Koné Mamadou", phone: "+225 05 55 66 77", role: "livreur", ordersHandled: 47, status: "active" },
  { id: "tm-2", name: "Traoré Issa", phone: "+225 07 88 99 00", role: "livreur", ordersHandled: 32, status: "active" },
  { id: "tm-3", name: "Bamba Ali", phone: "+225 01 22 33 44", role: "livreur", ordersHandled: 28, status: "active" },
  { id: "tm-4", name: "Diallo Fatoumata", phone: "+225 07 11 22 33", role: "caller", ordersHandled: 124, status: "active" },
  { id: "tm-5", name: "Sow Mariama", phone: "+225 05 44 55 66", role: "preparateur", ordersHandled: 89, status: "active" },
  { id: "tm-6", name: "Admin Principal", phone: "+225 07 00 00 01", role: "admin", ordersHandled: 0, status: "active" },
];
