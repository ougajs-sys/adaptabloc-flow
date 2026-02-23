// Currency detection and conversion utilities

export type SupportedCurrency = "XOF" | "EUR" | "USD";

// Approximate fixed rates (XOF base) — updated manually or via API
const RATES_FROM_XOF: Record<SupportedCurrency, number> = {
  XOF: 1,
  EUR: 1 / 655.957, // 1 EUR = 655.957 XOF (fixed peg)
  USD: 1 / 600,      // approximate
};

// West African FCFA countries
const XOF_COUNTRIES = [
  "CI", "SN", "ML", "BF", "NE", "TG", "BJ", "GW", // UEMOA
  "CM", "GA", "CG", "TD", "CF", "GQ",                // CEMAC (XAF ≈ XOF)
];

const EUR_COUNTRIES = [
  "FR", "DE", "IT", "ES", "PT", "BE", "NL", "AT", "FI", "IE",
  "GR", "LU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR",
];

export function detectCurrency(countryCode?: string | null): SupportedCurrency {
  if (!countryCode) return "XOF";
  const upper = countryCode.toUpperCase();
  if (XOF_COUNTRIES.includes(upper)) return "XOF";
  if (EUR_COUNTRIES.includes(upper)) return "EUR";
  return "USD";
}

export function convertFromXOF(amountXOF: number, target: SupportedCurrency): number {
  const rate = RATES_FROM_XOF[target];
  return Math.round(amountXOF * rate * 100) / 100;
}

export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  if (currency === "XOF") {
    return `${amount.toLocaleString("fr-FR")} FCFA`;
  }
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
}

export function getCurrencySymbol(currency: SupportedCurrency): string {
  if (currency === "XOF") return "FCFA";
  if (currency === "EUR") return "€";
  return "$";
}

// Provider market matching
export function getProvidersForCountry(countryCode: string): string[] {
  const upper = countryCode.toUpperCase();
  const providers: string[] = [];
  
  // CinetPay: Francophone Africa
  if (["CI", "SN", "ML", "BF", "NE", "TG", "BJ", "CM", "GA", "CG", "TD", "CF", "GQ", "GW", "GN", "CD", "RW"].includes(upper)) {
    providers.push("cinetpay");
  }
  
  // PayDunya: West Africa
  if (["CI", "SN", "ML", "BF", "NE", "TG", "BJ", "GW", "GN"].includes(upper)) {
    providers.push("paydunya");
  }
  
  // Wave: CI and SN
  if (["CI", "SN"].includes(upper)) {
    providers.push("wave");
  }
  
  // Paystack: Africa + international (always available as fallback)
  providers.push("paystack");
  
  return providers;
}
