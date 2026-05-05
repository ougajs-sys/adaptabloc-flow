import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Internal cron endpoint. Requires Bearer CRON_SECRET to call.
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    const { data: expiredSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("status", "grace")
      .lt("grace_until", now);

    if (expiredSubs && expiredSubs.length > 0) {
      for (const sub of expiredSubs) {
        const subModules = (sub.modules as string[]) || [];
        if (subModules.length > 0) {
          await supabaseAdmin
            .from("store_modules")
            .delete()
            .eq("store_id", sub.store_id)
            .in("module_id", subModules);
        }
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", sub.id);
      }
    }

    const { data: dueSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lt("renewal_date", now);

    return new Response(
      JSON.stringify({
        expired_deactivated: expiredSubs?.length || 0,
        renewals_due: dueSubs?.length || 0,
        checked_at: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
