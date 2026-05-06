import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN")!;
const META_PHONE_ID = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID")!;
const META_TEMPLATE = Deno.env.get("META_WHATSAPP_TEMPLATE_NAME")!;
const META_LANG = Deno.env.get("META_WHATSAPP_LANGUAGE") || "fr";
const APP_URL = Deno.env.get("APP_URL") || "https://intramatepro.lovable.app";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function isValidE164(p: string) {
  return /^\+[1-9]\d{7,14}$/.test(p);
}

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, email, name, password } = await req.json();

    if (!phone || !email || !name || !password) {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidE164(phone)) {
      return new Response(JSON.stringify({ error: "Numéro WhatsApp invalide (format E.164: +221...)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Mot de passe trop court" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 3 envois / numéro / heure
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count: recentSends } = await supabase
      .from("whatsapp_send_log")
      .select("id", { count: "exact", head: true })
      .eq("phone_e164", phone)
      .gte("created_at", oneHourAgo);

    if ((recentSends ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Trop de demandes. Réessaie dans 1 heure." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérifier qu'aucun compte n'existe déjà avec cet email
    const { data: existing } = await supabase.auth.admin.listUsers();
    if (existing?.users?.some((u: any) => u.email === email)) {
      return new Response(JSON.stringify({ error: "Un compte existe déjà avec cet email" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Générer token + hash
    const token = generateToken();
    const codeHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

    // Invalider tokens précédents pour ce phone
    await supabase.from("whatsapp_otps")
      .delete()
      .eq("phone_e164", phone)
      .eq("purpose", "signup");

    // Stocker
    const { error: insertErr } = await supabase.from("whatsapp_otps").insert({
      phone_e164: phone,
      email,
      name,
      code_hash: codeHash,
      purpose: "signup",
      expires_at: expiresAt,
      signup_payload: { password },
    });
    if (insertErr) throw insertErr;

    // Construire le lien
    const magicLink = `${APP_URL}/verify?t=${token}`;
    const phoneClean = phone.replace(/^\+/, "");

    // Envoyer via Meta Cloud API
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${META_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${META_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneClean,
          type: "template",
          template: {
            name: META_TEMPLATE,
            language: { code: META_LANG },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: name }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: `?t=${token}` }],
              },
            ],
          },
        }),
      }
    );

    const metaJson = await metaRes.json();
    const success = metaRes.ok;

    await supabase.from("whatsapp_send_log").insert({
      phone_e164: phone,
      purpose: "signup",
      success,
      error_message: success ? null : JSON.stringify(metaJson),
      ip: req.headers.get("x-forwarded-for") || null,
    });

    if (!success) {
      console.error("Meta API error:", metaJson);
      return new Response(JSON.stringify({
        error: "Échec de l'envoi WhatsApp. Vérifie le numéro et réessaie.",
        details: metaJson,
      }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, expiresIn: 1800 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    const e = err as Error;
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
