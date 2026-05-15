import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_TOKEN    = Deno.env.get("META_WHATSAPP_TOKEN")!;
const META_PHONE_ID = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID")!;
const META_TEMPLATE = Deno.env.get("META_WHATSAPP_TEMPLATE_NAME")!;
const META_LANG     = Deno.env.get("META_WHATSAPP_LANGUAGE") || "fr";
const APP_URL       = Deno.env.get("APP_URL") || "https://intramatepro.lovable.app";

function isValidE164(p: string) {
  return /^\+[1-9]\d{7,14}$/.test(p);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl      = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey          = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone, role, store_id } = await req.json();

    if (!phone || !role || !store_id) {
      return new Response(JSON.stringify({ error: "Champs requis manquants (phone, role, store_id)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidE164(phone)) {
      return new Response(JSON.stringify({ error: "Numéro invalide. Format attendu : +221771234567" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin of the store
    const { data: isAdmin } = await callerClient.rpc("has_role", { _store_id: store_id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: 20 invitations per store per hour (shared with email invitations)
    const windowStart = new Date(Date.now() - 3600_000).toISOString();
    const { count: hitCount } = await adminClient
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("identifier", store_id)
      .eq("endpoint", "send-invitation")
      .gte("hit_at", windowStart);
    if ((hitCount ?? 0) >= 20) {
      return new Response(JSON.stringify({ error: "Trop d'invitations envoyées. Réessayez dans une heure." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await adminClient.from("rate_limit_hits").insert({ identifier: store_id, endpoint: "send-invitation" });

    // Fetch store name for the WhatsApp message
    const { data: store } = await adminClient
      .from("stores")
      .select("name")
      .eq("id", store_id)
      .single();
    const storeName = store?.name ?? "votre boutique";

    // Create invitation record
    const { data: inv, error: invErr } = await adminClient
      .from("team_invitations")
      .insert({ store_id, phone_e164: phone, role, channel: "whatsapp" })
      .select("token")
      .single();
    if (invErr) {
      if (invErr.code === "23505") {
        return new Response(JSON.stringify({ error: "Une invitation est déjà en attente pour ce numéro." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw invErr;
    }

    // Build invitation link — reuses the /verify route so we can use the same Meta template.
    // The ?inv= param triggers the invitation flow in VerifyWhatsApp.tsx.
    const invLink = `${APP_URL}/verify?inv=${inv.token}`;
    const phoneClean = phone.replace(/^\+/, "");

    // Send via Meta Cloud API (reuses signup template — same button URL base)
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
                parameters: [{ type: "text", text: storeName }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: `?inv=${inv.token}` }],
              },
            ],
          },
        }),
      }
    );

    const metaJson = await metaRes.json();
    const success  = metaRes.ok;

    if (!success) {
      // Rollback the invitation if sending fails
      await adminClient.from("team_invitations").delete().eq("token", inv.token);
      console.error("Meta API error:", metaJson);
      return new Response(JSON.stringify({ error: "Échec de l'envoi WhatsApp.", details: metaJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
