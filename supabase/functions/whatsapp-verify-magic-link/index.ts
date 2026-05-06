import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 32) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const codeHash = await hashToken(token);

    const { data: otp, error: otpErr } = await supabase
      .from("whatsapp_otps")
      .select("*")
      .eq("code_hash", codeHash)
      .eq("purpose", "signup")
      .maybeSingle();

    if (otpErr) throw otpErr;
    if (!otp) {
      return new Response(JSON.stringify({ error: "Lien invalide ou déjà utilisé" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (otp.verified_at) {
      return new Response(JSON.stringify({ error: "Lien déjà utilisé" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(otp.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Lien expiré. Demande un nouveau lien.", expired: true }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const password = (otp.signup_payload as any)?.password;
    if (!password) {
      return new Response(JSON.stringify({ error: "Données d'inscription corrompues" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Créer le compte (email confirmé d'office, validé par WhatsApp)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: otp.email!,
      password,
      email_confirm: true,
      phone: otp.phone_e164,
      user_metadata: {
        full_name: otp.name,
        phone_e164: otp.phone_e164,
        whatsapp_verified: true,
      },
    });

    if (createErr || !created.user) {
      console.error("createUser error:", createErr);
      return new Response(JSON.stringify({ error: createErr?.message || "Création du compte échouée" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marquer OTP utilisé
    await supabase.from("whatsapp_otps")
      .update({ verified_at: new Date().toISOString(), user_id: created.user.id, signup_payload: null })
      .eq("id", otp.id);

    return new Response(JSON.stringify({
      success: true,
      email: otp.email,
      // Le client se connectera avec email/password classique
    }), {
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
