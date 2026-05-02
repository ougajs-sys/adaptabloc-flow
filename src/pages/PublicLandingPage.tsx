import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Check, ChevronDown, Shield, Truck, RotateCcw, Star } from "lucide-react";

interface TemplateData {
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  cta_text?: string;
  primary_color?: string;
  features?: { title: string; description: string }[];
}

interface PublicPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  mode: "template" | "html";
  template_data: TemplateData;
  html_content: string | null;
  embed_form_id: string | null;
  status: string;
}

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["public-landing-page", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages" as never)
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as PublicPage | null;
    },
  });

  useEffect(() => {
    if (!page || !slug) return;
    supabase.rpc("increment_landing_page_views" as never, { p_slug: slug } as never).then(() => {});
  }, [page?.id, slug]);

  useEffect(() => {
    if (!page) return;
    document.title = page.meta_title || page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && (page.meta_description || page.description)) {
      meta.setAttribute("content", page.meta_description || page.description || "");
    }
  }, [page]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#8B5CF6" }} />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: "1.5rem" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <AlertCircle size={28} style={{ color: "#9CA3AF" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: ".5rem" }}>Page introuvable</h1>
          <p style={{ fontSize: ".875rem", color: "#6B7280", marginBottom: "1.5rem" }}>
            Cette page n'existe pas ou n'est plus accessible.
          </p>
          <Link to="/" style={{ color: "#8B5CF6", fontWeight: 600, fontSize: ".875rem" }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return page.mode === "html" ? <HtmlMode page={page} /> : <TemplateMode page={page} />;
};

// ─── Template Mode (full redesign) ───────────────────────────────────
function TemplateMode({ page }: { page: PublicPage }) {
  const data = page.template_data || {};
  const primary = data.primary_color || "#8B5CF6";
  const hasImage = !!data.hero_image_url;
  const heroText = hasImage ? "#ffffff" : "#111827";
  const heroSubtext = hasImage ? "rgba(255,255,255,.85)" : "#4B5563";

  const scrollToForm = () => {
    document.getElementById("lp-order-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @keyframes lp-fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-floatBlob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes lp-glowPulse {
          0%, 100% { box-shadow: 0 8px 30px ${primary}50; }
          50%       { box-shadow: 0 10px 45px ${primary}85; }
        }
        @keyframes lp-arrowBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(7px); }
        }
        .lp-u1 { animation: lp-fadeUp .65s ease .05s both; }
        .lp-u2 { animation: lp-fadeUp .65s ease .15s both; }
        .lp-u3 { animation: lp-fadeUp .65s ease .25s both; }
        .lp-u4 { animation: lp-fadeUp .65s ease .35s both; }
        .lp-u5 { animation: lp-fadeUp .65s ease .45s both; }
        .lp-blob { animation: lp-floatBlob 4s ease-in-out infinite; }
        .lp-cta-btn {
          animation: lp-glowPulse 2.2s ease-in-out infinite;
          transition: transform .15s ease;
        }
        .lp-cta-btn:hover { transform: scale(1.05) !important; }
        .lp-arrow { animation: lp-arrowBounce 1.8s ease-in-out infinite; }
        .lp-feat {
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .lp-feat:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 35px rgba(0,0,0,.10) !important;
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: "#fff", color: "#111827", minHeight: "100vh" }}>

        {/* ══════════════ HERO ══════════════ */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

          {hasImage ? (
            <>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${data.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.52) 0%, rgba(0,0,0,.46) 40%, rgba(0,0,0,.78) 100%)" }} />
            </>
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${primary}13 0%, #ffffff 55%, ${primary}08 100%)` }} />
              <div className="lp-blob" style={{ position: "absolute", top: "-8rem", right: "-8rem", width: "32rem", height: "32rem", borderRadius: "50%", background: `radial-gradient(circle, ${primary}28 0%, transparent 68%)`, filter: "blur(55px)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-7rem", left: "-7rem", width: "28rem", height: "28rem", borderRadius: "50%", background: `radial-gradient(circle, ${primary}16 0%, transparent 68%)`, filter: "blur(55px)", pointerEvents: "none" }} />
            </>
          )}

          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "820px", margin: "0 auto", padding: "5rem 1.25rem 7rem", textAlign: "center" }}>

            {/* Badge */}
            <div className="lp-u1" style={{ display: "inline-flex", alignItems: "center", gap: ".45rem", padding: ".38rem 1.1rem", borderRadius: "9999px", fontSize: ".78rem", fontWeight: 600, marginBottom: "1.4rem", background: hasImage ? "rgba(255,255,255,.18)" : `${primary}18`, color: hasImage ? "#fff" : primary, backdropFilter: hasImage ? "blur(10px)" : undefined, border: hasImage ? "1px solid rgba(255,255,255,.25)" : `1px solid ${primary}35` }}>
              <Star size={11} fill="currentColor" />
              Commande rapide · Livraison sous 24h
            </div>

            {/* Title */}
            <h1 className="lp-u2" style={{ fontSize: "clamp(2rem, 5.5vw, 3.8rem)", fontWeight: 800, lineHeight: 1.13, letterSpacing: "-.025em", color: heroText, marginBottom: "1.2rem", fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
              {data.hero_title || page.title}
            </h1>

            {/* Subtitle */}
            {data.hero_subtitle && (
              <p className="lp-u3" style={{ fontSize: "clamp(.95rem, 2.5vw, 1.16rem)", color: heroSubtext, lineHeight: 1.72, maxWidth: "580px", margin: "0 auto 2.5rem" }}>
                {data.hero_subtitle}
              </p>
            )}

            {/* CTA */}
            <div className="lp-u4" style={{ marginBottom: "2.25rem", marginTop: data.hero_subtitle ? 0 : "2.5rem" }}>
              <button
                onClick={scrollToForm}
                className="lp-cta-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: ".7rem", padding: "1rem 2.6rem", borderRadius: "9999px", background: primary, color: "#fff", fontWeight: 700, fontSize: "clamp(.95rem, 2.2vw, 1.08rem)", border: "none", cursor: "pointer", letterSpacing: "-.01em" }}
              >
                {data.cta_text || "Commander maintenant"}
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Trust strip */}
            <div className="lp-u5" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: ".8rem 2rem", fontSize: ".8rem", color: heroSubtext }}>
              {[
                { Icon: Shield,    label: "Paiement à la livraison" },
                { Icon: Truck,     label: "Livraison rapide" },
                { Icon: RotateCcw, label: "Satisfait ou remboursé" },
              ].map(({ Icon, label }) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
                  <Icon size={13} style={{ color: hasImage ? "rgba(255,255,255,.75)" : primary }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Scroll arrow */}
          <button onClick={scrollToForm} className="lp-arrow" style={{ position: "absolute", bottom: "1.75rem", left: "50%", background: "none", border: "none", cursor: "pointer", color: hasImage ? "rgba(255,255,255,.4)" : "#CBD5E1", padding: ".5rem" }}>
            <ChevronDown size={26} />
          </button>
        </section>

        {/* ══════════════ FEATURES ══════════════ */}
        {data.features && data.features.length > 0 && (
          <section style={{ padding: "4.5rem 1.25rem", background: "#F9FAFB" }}>
            <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.25rem" }}>
              {data.features.map((f, i) => (
                <div key={i} className="lp-feat" style={{ background: "#fff", borderRadius: "1.1rem", padding: "1.75rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)" }}>
                  <div style={{ width: "3rem", height: "3rem", borderRadius: ".75rem", background: `${primary}16`, color: primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <Check size={21} strokeWidth={3} />
                  </div>
                  <h3 style={{ fontWeight: 700, color: "#111827", marginBottom: ".4rem", fontSize: ".95rem" }}>{f.title}</h3>
                  <p style={{ fontSize: ".825rem", color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════ DESCRIPTION ══════════════ */}
        {page.description && (
          <section style={{ padding: "3.5rem 1.25rem" }}>
            <p style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", fontSize: "clamp(.95rem, 2vw, 1.08rem)", color: "#374151", lineHeight: 1.82 }}>
              {page.description}
            </p>
          </section>
        )}

        {/* ══════════════ ORDER FORM ══════════════ */}
        {page.embed_form_id && (
          <section id="lp-order-form" style={{ padding: "4.5rem 1.25rem", background: "#F9FAFB" }}>
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2.1rem)", fontWeight: 800, color: "#111827", fontFamily: "'Space Grotesk', sans-serif", marginBottom: ".4rem" }}>
                  {data.cta_text || "Commander maintenant"}
                </h2>
                <p style={{ fontSize: ".875rem", color: "#6B7280" }}>
                  Remplissez le formulaire ci-dessous pour passer votre commande
                </p>
              </div>
              <div style={{ background: "#fff", borderRadius: "1.5rem", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.08)", border: "1px solid #F3F4F6" }}>
                <iframe
                  src={`/embed/order?formId=${page.embed_form_id}&color=${primary.replace("#", "")}`}
                  style={{ width: "100%", height: 760, border: "none", display: "block" }}
                  title="Formulaire de commande"
                />
              </div>
            </div>
          </section>
        )}

        {!page.embed_form_id && (
          <section style={{ padding: "3rem 1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: ".875rem", color: "#9CA3AF" }}>
              Le formulaire de commande n'est pas encore configuré pour cette page.
            </p>
          </section>
        )}

        {/* ══════════════ FOOTER ══════════════ */}
        <footer style={{ padding: "2rem 1.25rem", textAlign: "center", borderTop: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: ".72rem", color: "#9CA3AF", margin: 0 }}>
            Page créée avec{" "}
            <Link to="/" style={{ color: primary, fontWeight: 600, textDecoration: "none" }}>
              Intramate
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}

// ─── HTML mode (sandboxed iframe) ────────────────────────────────────
function HtmlMode({ page }: { page: PublicPage }) {
  const primary = page.template_data?.primary_color || "#8B5CF6";

  const formBlock = page.embed_form_id
    ? `<section id="lp-order-form" style="padding:4rem 1.25rem;background:#F9FAFB">
        <div style="max-width:640px;margin:0 auto">
          <h2 style="text-align:center;font-size:1.75rem;font-weight:800;color:#111827;margin-bottom:1.5rem;font-family:sans-serif">Commander maintenant</h2>
          <div style="background:#fff;border-radius:1.5rem;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.08);border:1px solid #F3F4F6">
            <iframe src="${window.location.origin}/embed/order?formId=${page.embed_form_id}&color=${primary.replace("#", "")}" style="width:100%;height:760px;border:none;display:block" title="Formulaire de commande"></iframe>
          </div>
        </div>
      </section>`
    : "";

  const base = page.html_content || `<p style="padding:40px;text-align:center;color:#888;font-family:sans-serif">Aucun contenu HTML</p>`;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      <iframe
        srcDoc={base + formBlock}
        sandbox="allow-forms allow-popups allow-same-origin"
        style={{ flex: 1, width: "100%", border: "none", minHeight: "100vh" }}
        title={page.title}
      />
      <div style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 50 }}>
        <Link
          to="/"
          style={{ fontSize: ".7rem", color: "#9CA3AF", background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", padding: ".3rem .8rem", borderRadius: "9999px", border: "1px solid #E5E7EB", textDecoration: "none", display: "inline-block" }}
        >
          Propulsé par <span style={{ color: primary, fontWeight: 600 }}>Intramate</span>
        </Link>
      </div>
    </div>
  );
}

export default PublicLandingPage;
