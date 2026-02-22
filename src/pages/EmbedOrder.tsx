import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
}

const EmbedOrder = () => {
  const [searchParams] = useSearchParams();
  const brand = searchParams.get("brand") || "Ma Boutique";
  const color = `#${searchParams.get("color") || "8B5CF6"}`;
  const formId = searchParams.get("formId") || "";
  const redirectUrl = searchParams.get("redirect") || "";
  const preselectedProductId = searchParams.get("productId") || "";

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

  // Fetch form to get store_id, then fetch products
  useEffect(() => {
    if (!formId) return;
    (async () => {
      // We use the edge function URL pattern to fetch products via form's store_id
      // But since this is public, we query directly with anon key
      const { data: form } = await supabase
        .from("embed_forms")
        .select("store_id")
        .eq("id", formId)
        .maybeSingle();

      if (!form) return;

      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("store_id", form.store_id)
        .eq("is_active", true)
        .order("name");

      setProducts(prods || []);
    })();
  }, [formId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const total = (selectedProduct?.price || 0) * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) return;

    setSubmitting(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-form", {
        body: {
          formId,
          data: {
            name,
            phone,
            product: selectedProduct?.name || "",
            quantity: String(quantity),
            address,
          },
        },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setSuccessMessage(data.message || "Commande enregistrée avec succès !");
        setSuccess(true);
        if (redirectUrl) {
          setTimeout(() => {
            window.top?.location.assign(redirectUrl);
          }, 2000);
        }
      } else {
        setError(data?.error || "Une erreur est survenue");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
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
