import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cron-only endpoint. Re-validates every active Chariow license against
// the Chariow REST API. If a license is no longer valid (revoked, expired,
// not found), the matching subscription is moved to grace, and after the
// grace period expires `check-subscriptions` will deactivate modules.
//
// Authorization: Bearer ${CRON_SECRET}
//
// Suggested schedule: every 6 hours (configure in Supabase Cron).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function machineIdentifierFor(storeId: string): Promise<string> {
  // Stable per-store identifier (we are not pinning to physical hardware)
  const enc = new TextEncoder().encode(`intramate:store:${storeId}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const CHARIOW_SECRET_KEY = Deno.env.get("CHARIOW_SECRET_KEY");
    if (!CHARIOW_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "CHARIOW_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("id, store_id, chariow_license_key, chariow_product_id, status")
      .not("chariow_license_key", "is", null)
      .in("status", ["active", "grace"]);

    let validated = 0;
    let invalidated = 0;
    let errors = 0;
    const now = new Date();

    for (const sub of subs || []) {
      try {
        const machineId = await machineIdentifierFor(sub.store_id);
        const res = await fetch("https://api.chariow.com/v1/licenses/activate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${CHARIOW_SECRET_KEY}`,
          },
          body: JSON.stringify({
            license_key: sub.chariow_license_key,
            identifier: machineId,
          }),
        });

        const data = await res.json().catch(() => ({}));
        const isValid = res.ok && (data?.valid !== false) && (data?.status !== "revoked");

        if (isValid) {
          // Record activation (UPSERT via UNIQUE index)
          await supabaseAdmin.from("chariow_license_activations").upsert({
            subscription_id: sub.id,
            store_id: sub.store_id,
            license_key: sub.chariow_license_key,
            machine_identifier: machineId,
            user_agent: "intramate-cron",
            status: "active",
            last_seen_at: now.toISOString(),
          }, { onConflict: "license_key,machine_identifier" });

          await supabaseAdmin
            .from("subscriptions")
            .update({
              chariow_machine_identifier: machineId,
              chariow_last_validated_at: now.toISOString(),
              status: sub.status === "grace" ? "active" : sub.status,
              grace_until: sub.status === "grace" ? null : undefined,
            })
            .eq("id", sub.id);
          validated++;
        } else {
          // License invalid: move to grace if currently active
          if (sub.status === "active") {
            const graceUntil = new Date();
            graceUntil.setDate(graceUntil.getDate() + 3);
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "grace",
                grace_until: graceUntil.toISOString(),
              })
              .eq("id", sub.id);
          }
          invalidated++;
        }
      } catch (err) {
        errors++;
        console.error(`Validation failed for sub ${sub.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        checked: subs?.length || 0,
        validated,
        invalidated,
        errors,
        checked_at: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
