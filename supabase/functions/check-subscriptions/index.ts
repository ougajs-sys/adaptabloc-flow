import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This function checks for expired subscriptions and deactivates modules
// It should be called via a cron job daily

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // 1. Find subscriptions past grace period → deactivate
    const { data: expiredSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("status", "grace")
      .lt("grace_until", now);

    if (expiredSubs && expiredSubs.length > 0) {
      for (const sub of expiredSubs) {
        // Deactivate modules
        await supabaseAdmin
          .from("store_modules")
          .delete()
          .eq("store_id", sub.store_id);

        // Mark subscription as expired
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", sub.id);
      }
    }

    // 2. Find subscriptions due for renewal (renewal_date <= now, status = active)
    const { data: dueSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lt("renewal_date", now);

    // For each due subscription, we would trigger a payment via the provider
    // For now, just log them. Real implementation would call provider APIs.
    const dueCount = dueSubs?.length || 0;

    return new Response(
      JSON.stringify({
        expired_deactivated: expiredSubs?.length || 0,
        renewals_due: dueCount,
        checked_at: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
