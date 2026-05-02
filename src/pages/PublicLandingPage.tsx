import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Check } from "lucide-react";

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

  // Increment view count once on mount
  useEffect(() => {
    if (!page || !slug) return;
    supabase.rpc("increment_landing_page_views" as never, { p_slug: slug } as never).then(() => {});
  }, [page?.id, slug]);

  // Update document title and meta
  useEffect(() => {
    if (!page) return;
    document.title = page.meta_title || page.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && (page.meta_description || page.description)) {
      metaDesc.setAttribute("content", page.meta_description || page.description || "");
    }
  }, [page]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page introuvable</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Cette page n'existe pas ou n'est plus accessible.
          </p>
          <Link to="/" className="text-primary hover:underline text-sm">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return page.mode === "html"
    ? <HtmlMode page={page} />
    : <TemplateMode page={page} />;
};

// ─── Template renderer ───────────────────────────────────────────────
function TemplateMode({ page }: { page: PublicPage }) {
  const data = page.template_data || {};
  const primary = data.primary_color || "#8B5CF6";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {data.hero_image_url ? (
          <div
            className="h-[60vh] min-h-[400px] bg-cover bg-center"
            style={{ backgroundImage: `url(${data.hero_image_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          </div>
        ) : (
          <div
            className="h-[40vh] min-h-[300px]"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primary}88)` }}
          />
        )}
        <div className={`container mx-auto px-6 max-w-4xl ${data.hero_image_url ? "absolute bottom-12 left-0 right-0 text-white" : "py-12 text-white"}`}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[Space_Grotesk] mb-4 leading-tight">
            {data.hero_title || page.title}
          </h1>
          {data.hero_subtitle && (
            <p className="text-lg md:text-xl opacity-95 max-w-2xl">{data.hero_subtitle}</p>
          )}
        </div>
      </section>

      {/* Features */}
      {data.features && data.features.length > 0 && (
        <section className="container mx-auto px-6 py-12 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.features.map((f, i) => (
              <div key={i} className="text-center p-5 rounded-xl border border-border/50 bg-card">
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${primary}20`, color: primary }}
                >
                  <Check size={22} />
                </div>
                <p className="font-semibold text-foreground mb-1">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Description */}
      {page.description && (
        <section className="container mx-auto px-6 py-8 max-w-3xl">
          <p className="text-base text-foreground/90 leading-relaxed text-center">
            {page.description}
          </p>
        </section>
      )}

      {/* Order form */}
      {page.embed_form_id && (
        <section className="container mx-auto px-6 py-12 max-w-2xl">
          <div className="rounded-2xl overflow-hidden border border-border/50 shadow-xl">
            <iframe
              src={`/embed/order?formId=${page.embed_form_id}&color=${primary.replace("#", "")}`}
              className="w-full"
              style={{ height: 700, border: "none" }}
              title="Formulaire de commande"
            />
          </div>
        </section>
      )}

      {/* Fallback CTA if no form */}
      {!page.embed_form_id && (
        <section className="container mx-auto px-6 py-12 max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            Le formulaire de commande n'est pas encore configuré pour cette page.
          </p>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
          Propulsé par <Link to="/" className="text-primary hover:underline font-medium">Intramate</Link>
        </div>
      </footer>
    </div>
  );
}

// ─── HTML mode (sandboxed iframe) ────────────────────────────────────
function HtmlMode({ page }: { page: PublicPage }) {
  const formIframe = page.embed_form_id
    ? `<div style="max-width:600px;margin:40px auto;padding:0 20px"><iframe src="${window.location.origin}/embed/order?formId=${page.embed_form_id}" style="width:100%;height:700px;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1)" title="Formulaire de commande"></iframe></div>`
    : "";

  const baseHtml = page.html_content || `<p style="padding:40px;text-align:center;color:#888;font-family:sans-serif">Aucun contenu HTML</p>`;
  const fullHtml = baseHtml + formIframe;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <iframe
        srcDoc={fullHtml}
        sandbox="allow-forms allow-popups allow-same-origin"
        className="flex-1 w-full"
        style={{ border: "none", minHeight: "100vh" }}
        title={page.title}
      />
      {/* Tiny floating footer */}
      <div className="fixed bottom-3 right-3 z-50">
        <Link
          to="/"
          className="text-[10px] text-muted-foreground bg-background/80 backdrop-blur px-2.5 py-1 rounded-full border border-border/60 hover:text-foreground transition-colors"
        >
          Propulsé par <span className="text-primary font-semibold">Intramate</span>
        </Link>
      </div>
    </div>
  );
}

export default PublicLandingPage;
