import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { invitation_token, email, password, name } = await req.json();

    if (!invitation_token || !email || !password || !name) {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Mot de passe trop court (8 caractères minimum)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the pending invitation
    const { data: inv, error: invErr } = await supabase
      .from("team_invitations")
      .select("id, store_id, role, status, stores(name)")
      .eq("token", invitation_token)
      .eq("status", "pending")
      .maybeSingle();

    if (invErr) throw invErr;
    if (!inv) {
      return new Response(JSON.stringify({ error: "Invitation introuvable, déjà acceptée ou expirée." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check email not already taken
    const { data: existing } = await supabase.auth.admin.listUsers();
    if (existing?.users?.some((u: any) => u.email === email)) {
      return new Response(JSON.stringify({
        error: "Un compte existe déjà avec cet email. Connectez-vous puis acceptez l'invitation.",
        email_exists: true,
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user account (email confirmed because WhatsApp ownership is proof)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (createErr || !created.user) {
      throw createErr ?? new Error("Création du compte échouée");
    }

    const userId   = created.user.id;
    const storeId  = inv.store_id;
    const storeName = (inv as any).stores?.name ?? "votre boutique";

    // Check not already a member
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: userId, store_id: storeId, role: inv.role });
    }

    // Create profile
    await supabase.from("profiles").upsert({
      user_id: userId,
      store_id: storeId,
      name,
      email,
    }, { onConflict: "user_id,store_id" });

    // Mark invitation accepted
    await supabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", inv.id);

    return new Response(JSON.stringify({ success: true, email, store_name: storeName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
