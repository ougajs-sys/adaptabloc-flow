import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Truck,
  BarChart3,
  MessageSquare,
  Settings,
  HelpCircle,
  FormInput,
  Tags,
  FileDown,
  Mail,
  History,
  Boxes,
  UsersRound,
  Award,
  MapPin,
  Bot,
  Code,
  Store,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type ModuleTier = "free" | "tier1" | "tier2" | "tier3";

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tier: ModuleTier;
  price: number; // FCFA/mois
  routes?: string[];
  features: string[];
  category: string;
}

export const tierLabels: Record<ModuleTier, string> = {
  free: "Gratuit",
  tier1: "Niveau 1",
  tier2: "Niveau 2",
  tier3: "Niveau 3",
};

export const tierPriceRanges: Record<ModuleTier, string> = {
  free: "Inclus",
  tier1: "2 000 – 5 000 FCFA/mois",
  tier2: "5 000 – 10 000 FCFA/mois",
  tier3: "10 000 – 15 000 FCFA/mois",
};

export const modulesRegistry: ModuleDefinition[] = [
  // === FREE ===
  {
    id: "dashboard",
    name: "Tableau de bord simple",
    description: "Vue d'ensemble de votre activité avec KPIs essentiels.",
    icon: LayoutDashboard,
    tier: "free",
    price: 0,
    routes: ["/dashboard"],
    features: ["kpi_basic", "revenue_chart", "recent_orders"],
    category: "Principal",
  },
  {
    id: "orders_basic",
    name: "Prise de commande basique",
    description: "Créez et suivez vos commandes simplement.",
    icon: ShoppingCart,
    tier: "free",
    price: 0,
    routes: ["/dashboard/orders"],
    features: ["order_list", "order_detail", "order_create"],
    category: "Principal",
  },
  {
    id: "customers_basic",
    name: "Base clients",
    description: "Gérez vos contacts et coordonnées clients.",
    icon: Users,
    tier: "free",
    price: 0,
    routes: ["/dashboard/customers"],
    features: ["customer_list", "customer_detail"],
    category: "Principal",
  },
  {
    id: "delivery_basic",
    name: "Suivi livraison simple",
    description: "Suivez vos livraisons avec un statut basique.",
    icon: Truck,
    tier: "free",
    price: 0,
    routes: ["/dashboard/deliveries"],
    features: ["delivery_list", "delivery_status"],
    category: "Principal",
  },

  // === TIER 1 ===
  {
    id: "custom_fields",
    name: "Champs personnalisés",
    description: "Ajoutez des champs personnalisés à vos fiches produits et clients.",
    icon: FormInput,
    tier: "tier1",
    price: 2000,
    features: ["product_custom_fields", "customer_custom_fields"],
    category: "Personnalisation",
  },
  {
    id: "custom_status",
    name: "Statuts personnalisés",
    description: "Créez vos propres statuts de commande adaptés à votre workflow.",
    icon: Tags,
    tier: "tier1",
    price: 2500,
    features: ["order_custom_status"],
    category: "Personnalisation",
  },
  {
    id: "export",
    name: "Export Excel/PDF",
    description: "Exportez vos données en Excel ou PDF en un clic.",
    icon: FileDown,
    tier: "tier1",
    price: 3000,
    features: ["export_excel", "export_pdf"],
    category: "Outils",
  },
  {
    id: "message_templates",
    name: "Templates de messages",
    description: "Modèles de messages prédéfinis pour vos communications.",
    icon: Mail,
    tier: "tier1",
    price: 2000,
    features: ["sms_templates", "whatsapp_templates"],
    category: "Communication",
  },
  {
    id: "customer_history",
    name: "Historique clients",
    description: "Consultez l'historique complet des achats de chaque client.",
    icon: History,
    tier: "tier1",
    price: 3000,
    features: ["customer_purchase_history", "customer_timeline"],
    category: "Clients",
  },

  // === TIER 2 ===
  {
    id: "stock_auto",
    name: "Gestion stock automatique",
    description: "Automatisez la gestion de votre stock avec alertes et FIFO.",
    icon: Boxes,
    tier: "tier2",
    price: 5000,
    features: ["stock_alerts", "stock_fifo", "stock_auto_update"],
    category: "Produits",
  },
  {
    id: "multi_delivery",
    name: "Multi-livreurs",
    description: "Gérez plusieurs livreurs et affectez-les aux livraisons.",
    icon: Truck,
    tier: "tier2",
    price: 5000,
    features: ["driver_management", "driver_assignment", "driver_stats"],
    category: "Livraisons",
  },
  {
    id: "segmentation",
    name: "Segmentation avancée",
    description: "Segmentez vos clients avec des filtres avancés.",
    icon: UsersRound,
    tier: "tier2",
    price: 5000,
    features: ["customer_segments", "customer_filters_advanced"],
    category: "Clients",
  },
  {
    id: "campaigns",
    name: "Campagnes SMS/WhatsApp",
    description: "Envoyez des campagnes ciblées par SMS ou WhatsApp.",
    icon: MessageSquare,
    tier: "tier2",
    price: 7000,
    routes: ["/dashboard/campaigns"],
    features: ["campaign_create", "campaign_segments", "campaign_history"],
    category: "Communication",
  },
  {
    id: "loyalty",
    name: "Programme fidélité",
    description: "Mettez en place un programme de fidélité avec points et récompenses.",
    icon: Award,
    tier: "tier2",
    price: 6000,
    features: ["loyalty_points", "loyalty_rewards", "loyalty_tiers"],
    category: "Clients",
  },

  // === TIER 3 ===
  {
    id: "geo_tracking",
    name: "Géolocalisation temps réel",
    description: "Suivez vos livraisons sur une carte en temps réel.",
    icon: MapPin,
    tier: "tier3",
    price: 10000,
    features: ["live_map", "driver_location", "delivery_eta"],
    category: "Livraisons",
  },
  {
    id: "automations",
    name: "Automatisations IA",
    description: "Automatisez vos tâches répétitives grâce à l'intelligence artificielle.",
    icon: Sparkles,
    tier: "tier3",
    price: 12000,
    features: ["auto_reorder", "auto_pricing", "auto_categorize"],
    category: "Outils",
  },
  {
    id: "api",
    name: "API complète",
    description: "Connectez EasyFlow à vos outils via une API REST complète.",
    icon: Code,
    tier: "tier3",
    price: 10000,
    features: ["api_rest", "webhooks", "api_docs"],
    category: "Outils",
  },
  {
    id: "multi_store",
    name: "Multi-boutiques",
    description: "Gérez plusieurs boutiques depuis un seul tableau de bord.",
    icon: Store,
    tier: "tier3",
    price: 15000,
    features: ["store_management", "store_analytics", "store_switch"],
    category: "Principal",
  },
  {
    id: "ai_assistant",
    name: "Assistant IA",
    description: "Un assistant conversationnel intelligent pour gérer votre boutique.",
    icon: Bot,
    tier: "tier3",
    price: 15000,
    features: ["ai_chat", "ai_recommendations", "ai_reports"],
    category: "Outils",
  },
];

// Free module IDs (always active)
export const FREE_MODULE_IDS = modulesRegistry
  .filter((m) => m.tier === "free")
  .map((m) => m.id);

export function getModuleById(id: string): ModuleDefinition | undefined {
  return modulesRegistry.find((m) => m.id === id);
}

export function getModulesByTier(tier: ModuleTier): ModuleDefinition[] {
  return modulesRegistry.filter((m) => m.tier === tier);
}

export function calculateMonthlyPrice(activeModuleIds: string[]): number {
  return activeModuleIds.reduce((total, id) => {
    const mod = getModuleById(id);
    return total + (mod?.price ?? 0);
  }, 0);
}
