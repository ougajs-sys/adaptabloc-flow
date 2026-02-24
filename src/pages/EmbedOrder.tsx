import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
}

const EmbedOrder = () => {
  const [searchParams] = useSearchParams();
  // Brand/UI params
  const brand = searchParams.get("brand") || "Ma Boutique";
  const color = `#${searchParams.get("color") || "8B5CF6"}`;
  // Store resolution: prefer store_id query param, else fall back to formId (legacy)
  const storeIdParam = searchParams.get("store_id") || "";
  const formId = searchParams.get("formId") || "";
  const redirectUrl = searchParams.get("redirect") || "";
  const preselectedProductId = searchParams.get("productId") || "";

  const [storeId, setStoreId] = useState(storeIdParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Resolve storeId from formId if store_id param is absent, then fetch products
  useEffect(() => {
    (async () => {
      let resolvedStoreId = storeIdParam;

      if (!resolvedStoreId && formId) {
        const { data: form } = await supabase
          .from("embed_forms")
          .select("store_id")
          .eq("id", formId)
          .maybeSingle();
        resolvedStoreId = form?.store_id || "";
      }

      if (!resolvedStoreId) return;
      setStoreId(resolvedStoreId);

      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("store_id", resolvedStoreId)
        .eq("is_active", true)
        .order("name");

      setProducts(prods || []);
    })();
  }, [storeIdParam, formId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const total = (selectedProduct?.price || 0) * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation: a product must be selected
    if (!selectedProduct) {
      setError("Veuillez sélectionner un produit.");
      return;
    }
    if (!storeId) {
      setError("Configuration invalide : store non identifié.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Upsert customer by phone + store_id
      let customerId: string | null = null;
      {
        // Try to find existing customer
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("store_id", storeId)
          .eq("phone", phone)
          .maybeSingle();

        if (existing) {
          customerId = existing.id;
        } else {
          const { data: created, error: customerError } = await supabase
            .from("customers")
            .insert({ store_id: storeId, name, phone, address, source: "embed_form" })
            .select("id")
            .single();
          if (customerError) throw customerError;
          customerId = created.id;
        }
      }

      // 2. Generate order number (timestamp + random suffix to avoid collisions)
      const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
      const orderNumber = `CMD-${Date.now().toString().slice(-8)}${rand}`;

      // 3. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          total_amount: total,
          shipping_address: address,
          source: "embed_form",
          status: "new",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // 4. Create order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity,
          unit_price: selectedProduct.price,
          total_price: total,
        });

      if (itemError) throw itemError;

      setSuccessMessage(`Commande ${orderNumber} enregistrée avec succès !`);
      setSuccess(true);
      if (redirectUrl) {
        setTimeout(() => {
          window.top?.location.assign(redirectUrl);
        }, 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 440, margin: "0 auto", padding: 24 }}>
        <div style={{
          textAlign: "center",
          padding: 32,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          background: "#fff",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>
            Merci !
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>{successMessage}</p>
          {redirectUrl && (
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 12 }}>Redirection en cours…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, sans-serif",
      maxWidth: 440,
      margin: "0 auto",
      padding: 20,
    }}>
      <div style={{
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 2 }}>{brand}</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>
            Commander maintenant
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
            Remplissez le formulaire pour passer votre commande
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Product */}
          <div>
            <label style={labelStyle}>
              <span style={{ marginRight: 6 }}>📦</span> Produit
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Sélectionner un produit</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price.toLocaleString("fr-FR")} FCFA
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>
              <span style={{ marginRight: 6 }}>👤</span> Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              required
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>
              <span style={{ marginRight: 6 }}>📞</span> Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 XX XX XX XX"
              required
              style={inputStyle}
            />
          </div>

          {/* Quantity */}
          <div>
            <label style={labelStyle}>
              <span style={{ marginRight: 6 }}>#</span> Quantité
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              min={1}
              style={inputStyle}
            />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>
              <span style={{ marginRight: 6 }}>📍</span> Adresse de livraison
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Votre adresse complète"
              required
              style={inputStyle}
            />
          </div>

          {/* Total */}
          {selectedProduct && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderTop: "1px solid #f3f4f6",
            }}>
              <span style={{ color: "#6b7280", fontSize: 14 }}>Total à payer</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>
                {total.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2",
              color: "#dc2626",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: submitting ? "#9ca3af" : color,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {submitting ? "Traitement en cours…" : "Confirmer ma commande"}
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  color: "#111",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

export default EmbedOrder;

