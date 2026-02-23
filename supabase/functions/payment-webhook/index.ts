import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { provider, event, transaction_id, status, store_id, metadata } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Handle payment confirmation from provider webhooks
    if (status === "completed" || status === "success") {
      // Update transaction status
      if (transaction_id) {
        await supabaseAdmin
          .from("transactions")
          .update({ status: "completed" })
          .eq("provider_reference", transaction_id);
      }

      // If this is a renewal payment
      if (event === "renewal" && store_id) {
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("store_id", store_id)
          .eq("status", "active")
          .single();

        if (sub) {
          const newRenewal = new Date(sub.renewal_date || new Date());
          newRenewal.setMonth(newRenewal.getMonth() + 1);

          await supabaseAdmin
            .from("subscriptions")
            .update({
              renewal_date: newRenewal.toISOString(),
              grace_until: null,
              status: "active",
            })
            .eq("id", sub.id);
        }
      }
    }

    // Handle payment failure
    if (status === "failed" && store_id) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("store_id", store_id)
        .eq("status", "active")
        .single();

      if (sub) {
        // Set grace period: 3 days
        const graceUntil = new Date();
        graceUntil.setDate(graceUntil.getDate() + 3);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "grace",
            grace_until: graceUntil.toISOString(),
          })
          .eq("id", sub.id);

        // Record failed transaction
        if (transaction_id) {
          await supabaseAdmin
            .from("transactions")
            .update({ status: "failed" })
            .eq("provider_reference", transaction_id);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
