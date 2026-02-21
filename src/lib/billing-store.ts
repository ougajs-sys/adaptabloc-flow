// ── Billing mock data store ──
// Simulates subscription plans, invoices, and payment methods.

export interface Plan {
  id: string;
  name: string;
  price: number; // FCFA / month
  description: string;
  features: string[];
  popular?: boolean;
}

export interface Invoice {
  id: string;
  date: string; // ISO
  amount: number;
  status: "paid" | "pending" | "failed";
  plan: string;
  reference: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "orange_money" | "mtn_money" | "wave";
  label: string;
  last4?: string;
  isDefault: boolean;
}

export interface Subscription {
  planId: string;
  status: "active" | "cancelled" | "trial";
  startDate: string;
  nextBilling: string;
}

// ── Plans ──

export const plans: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    description: "Pour démarrer et tester la plateforme",
    features: [
      "Jusqu'à 50 commandes/mois",
      "1 utilisateur",
      "Tableau de bord basique",
      "Support communautaire",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 15000,
    description: "Pour les entreprises en croissance",
    features: [
      "Commandes illimitées",
      "Jusqu'à 10 utilisateurs",
      "Statistiques avancées",
      "Campagnes marketing",
      "Livraisons multi-zones",
      "Support prioritaire",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 45000,
    description: "Pour les grandes organisations",
    features: [
      "Tout le plan Pro",
      "Utilisateurs illimités",
      "API personnalisée",
      "Intégrations sur mesure",
      "Account manager dédié",
      "SLA garanti 99.9%",
    ],
  },
];

// ── Mock invoices ──

export const mockInvoices: Invoice[] = [
  { id: "INV-2026-001", date: "2026-02-01", amount: 15000, status: "paid", plan: "Pro", reference: "PAY-9A3F2" },
  { id: "INV-2026-002", date: "2026-01-01", amount: 15000, status: "paid", plan: "Pro", reference: "PAY-8B2E1" },
  { id: "INV-2025-012", date: "2025-12-01", amount: 15000, status: "paid", plan: "Pro", reference: "PAY-7C1D0" },
  { id: "INV-2025-011", date: "2025-11-01", amount: 15000, status: "paid", plan: "Pro", reference: "PAY-6D0C9" },
  { id: "INV-2025-010", date: "2025-10-01", amount: 0, status: "paid", plan: "Gratuit", reference: "PAY-5E9B8" },
];

// ── Mock payment methods ──

export const mockPaymentMethods: PaymentMethod[] = [
  { id: "pm_1", type: "orange_money", label: "Orange Money", last4: "4523", isDefault: true },
  { id: "pm_2", type: "card", label: "Visa", last4: "4242", isDefault: false },
];

// ── Current subscription (simulated) ──

const SUBSCRIPTION_KEY = "easyflow_subscription";

export function getSubscription(): Subscription {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    planId: "free",
    status: "active",
    startDate: "2025-10-01",
    nextBilling: "2026-03-01",
  };
}

export function setSubscription(sub: Subscription) {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
}

export function getPlanById(id: string): Plan | undefined {
  return plans.find((p) => p.id === id);
}
