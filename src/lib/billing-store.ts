// ── Billing mock data store ──
// Aligned with the modular billing model (no fixed plans).

export interface Invoice {
  id: string;
  date: string; // ISO
  amount: number;
  status: "paid" | "pending" | "failed";
  modules: string[]; // active module IDs that month
  reference: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "orange_money" | "mtn_money" | "wave";
  label: string;
  last4?: string;
  isDefault: boolean;
}

// ── Mock invoices (modular) ──

export const mockInvoices: Invoice[] = [
  { id: "INV-2026-001", date: "2026-02-01", amount: 19000, status: "paid", modules: ["stock_auto", "campaigns", "extra_callers", "extra_drivers"], reference: "PAY-9A3F2" },
  { id: "INV-2026-002", date: "2026-01-01", amount: 19000, status: "paid", modules: ["stock_auto", "campaigns", "extra_callers", "extra_drivers"], reference: "PAY-8B2E1" },
  { id: "INV-2025-012", date: "2025-12-01", amount: 12000, status: "paid", modules: ["stock_auto", "campaigns"], reference: "PAY-7C1D0" },
  { id: "INV-2025-011", date: "2025-11-01", amount: 5000, status: "paid", modules: ["stock_auto"], reference: "PAY-6D0C9" },
  { id: "INV-2025-010", date: "2025-10-01", amount: 0, status: "paid", modules: [], reference: "PAY-5E9B8" },
];

// ── Mock payment methods ──

export const mockPaymentMethods: PaymentMethod[] = [
  { id: "pm_1", type: "orange_money", label: "Orange Money", last4: "4523", isDefault: true },
  { id: "pm_2", type: "card", label: "Visa", last4: "4242", isDefault: false },
];
