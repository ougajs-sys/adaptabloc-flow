import { useState, useCallback } from "react";
import type { OrderPipelineStatus } from "@/lib/team-roles";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  variant?: string;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: OrderPipelineStatus;
  paymentStatus: string;
  date: string;
  address: string;
  assignee?: string;
  callerNote?: string;
  prepNote?: string;
  deliveryNote?: string;
}

export const initialOrders: Order[] = [
  {
    id: "CMD-1247", customer: "Aminata Diallo", phone: "+225 07 12 34 56", email: "aminata@mail.com",
    items: [
      { name: "Sneakers Urban Pro", qty: 1, price: 25000, variant: "Taille 42 - Noir" },
      { name: "T-Shirt Classic Fit", qty: 2, price: 10000, variant: "Taille M - Blanc" },
    ],
    total: 45000, status: "delivered", paymentStatus: "paid", date: "2026-02-13T14:30:00",
    address: "Cocody, Rue des Jardins, Abidjan", assignee: "Koné Mamadou",
  },
  {
    id: "CMD-1246", customer: "Moussa Koné", phone: "+225 05 98 76 54", email: "moussa.k@mail.com",
    items: [{ name: "Sac Bandoulière Cuir", qty: 1, price: 28500, variant: "Marron" }],
    total: 28500, status: "in_transit", paymentStatus: "paid", date: "2026-02-13T12:15:00",
    address: "Plateau, Av. Terrasson, Abidjan", assignee: "Traoré Issa",
  },
  {
    id: "CMD-1245", customer: "Fatou Sow", phone: "+225 01 23 45 67", email: "fatou.s@mail.com",
    items: [
      { name: "Robe Été Fleurie", qty: 1, price: 18000, variant: "Taille S" },
      { name: "Sandales Dorées", qty: 1, price: 15000, variant: "Pointure 38" },
      { name: "Bracelet Perles", qty: 3, price: 2000 },
      { name: "Lunettes Soleil", qty: 1, price: 12000 },
      { name: "Foulard Soie", qty: 1, price: 16000 },
    ],
    total: 67000, status: "preparing", paymentStatus: "paid", date: "2026-02-13T10:45:00",
    address: "Marcory, Zone 4, Abidjan", assignee: "Sow Mariama",
  },
  {
    id: "CMD-1244", customer: "Ibrahim Traoré", phone: "+225 07 65 43 21", email: "ibrahim.t@mail.com",
    items: [{ name: "Casquette Sport", qty: 1, price: 15000 }],
    total: 15000, status: "delivered", paymentStatus: "paid", date: "2026-02-12T16:00:00",
    address: "Yopougon, Quartier Millionnaire, Abidjan", assignee: "Bamba Ali",
  },
  {
    id: "CMD-1243", customer: "Aïcha Bamba", phone: "+225 05 11 22 33", email: "aicha.b@mail.com",
    items: [
      { name: "Sneakers Urban Pro", qty: 2, price: 25000, variant: "Taille 39 - Blanc" },
      { name: "Sac à Dos Premium", qty: 1, price: 35000 },
      { name: "Montre Sport", qty: 1, price: 22000 },
    ],
    total: 107000, status: "cancelled", paymentStatus: "refunded", date: "2026-02-12T09:30:00",
    address: "Riviera 3, Abidjan",
  },
  {
    id: "CMD-1242", customer: "Oumar Cissé", phone: "+225 01 44 55 66", email: "oumar.c@mail.com",
    items: [
      { name: "Polo Premium", qty: 1, price: 18500, variant: "Taille L - Bleu" },
      { name: "Ceinture Cuir", qty: 1, price: 15000 },
    ],
    total: 33500, status: "confirmed", paymentStatus: "paid", date: "2026-02-12T08:00:00",
    address: "Treichville, Av. 12, Abidjan",
  },
  {
    id: "CMD-1241", customer: "Mariam Touré", phone: "+225 07 77 88 99", email: "mariam.t@mail.com",
    items: [{ name: "Ensemble Sport Femme", qty: 1, price: 32000, variant: "Taille M - Rose" }],
    total: 32000, status: "new", paymentStatus: "pending", date: "2026-02-11T18:20:00",
    address: "Abobo, Rond-point, Abidjan",
  },
  {
    id: "CMD-1240", customer: "Sékou Diarra", phone: "+225 05 00 11 22", email: "sekou.d@mail.com",
    items: [
      { name: "Chemise Lin", qty: 2, price: 22000, variant: "Taille XL - Beige" },
      { name: "Pantalon Chino", qty: 1, price: 18000, variant: "Taille 44 - Kaki" },
    ],
    total: 62000, status: "caller_pending", paymentStatus: "paid", date: "2026-02-11T15:10:00",
    address: "Bingerville, Résidence Palm, Abidjan", assignee: "Diallo Fatoumata",
  },
];
