import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Conversion rates (XOF base)
const RATES_FROM_XOF: Record<string, number> = {
  XOF: 1,
  EUR: 1 / 655.957,
  USD: 1 / 600,
};

function convertFromXOF(amountXOF: number, target: string): number {
  const rate = RATES_FROM_XOF[target] || 1;
  return Math.round(amountXOF * rate * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { store_id, provider, modules, currency, country } = await req.json();

    // Validate store membership
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("store_id", store_id)
      .limit(1);

    if (!role || role.length === 0) {
      return new Response(JSON.stringify({ error: "Not a member of this store" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider config
    const { data: providerData } = await supabaseAdmin
      .from("payment_providers")
      .select("*")
      .eq("name", provider)
      .eq("is_active", true)
      .single();

    if (!providerData) {
      return new Response(JSON.stringify({ error: "Provider not available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate amount from module prices (using modules-registry logic)
    // For now, we'll calculate server-side from the store_modules + a simple lookup
    // In production, module prices would be in a DB table
    const modulesPrices: Record<string, number> = {
      extra_callers: 2000, extra_preparers: 2000, extra_drivers: 3000,
      custom_fields: 2000, custom_status: 2500, export: 3000,
      message_templates: 2000, customer_history: 3000, stock_auto: 5000,
      multi_delivery: 5000, call_center: 7000, warehouse_team: 7000,
      segmentation: 5000, campaigns: 7000, loyalty: 6000,
      geo_tracking: 10000, automations: 12000, api: 10000,
      multi_store: 15000, ai_assistant: 15000, embed_forms: 5000,
    };

    const totalXOF = (modules as string[]).reduce((sum, id) => sum + (modulesPrices[id] || 0), 0);
    const totalConverted = convertFromXOF(totalXOF, currency || "XOF");
    const feeAmount = Math.round(totalConverted * (providerData.fee_percentage / 100) * 100) / 100;
    const netAmount = Math.round((totalConverted - feeAmount) * 100) / 100;

    // Calculate renewal date (1 month from now)
    const now = new Date();
    const renewalDate = new Date(now);
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    // In a real integration, we would call the provider's API here
    // For now, we simulate a successful payment and activate modules directly
    // This will be replaced with actual provider SDK calls when API keys are configured

    // Create subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .upsert({
        store_id,
        modules: modules as string[],
        amount: Math.round(totalConverted),
        currency: currency || "XOF",
        provider,
        country: country || null,
        status: "active",
        started_at: now.toISOString(),
        renewal_date: renewalDate.toISOString(),
      }, {
        onConflict: "store_id",
      })
      .select()
      .single();

    if (subError) {
      // If upsert fails (no unique on store_id), try insert
      const { data: newSub, error: insertErr } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          store_id,
          modules: modules as string[],
          amount: Math.round(totalConverted),
          currency: currency || "XOF",
          provider,
          country: country || null,
          status: "active",
          started_at: now.toISOString(),
          renewal_date: renewalDate.toISOString(),
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
    }

    // Record transaction
    await supabaseAdmin.from("transactions").insert({
      store_id,
      gross_amount: Math.round(totalConverted),
      net_amount: Math.round(netAmount),
      fee_amount: Math.round(feeAmount),
      currency: currency || "XOF",
      provider,
      country: country || null,
      status: "completed",
      subscription_id: subscription?.id || null,
    });

    // Activate modules in store_modules
    // First remove existing paid modules
    await supabaseAdmin
      .from("store_modules")
      .delete()
      .eq("store_id", store_id);

    // Insert all modules
    if ((modules as string[]).length > 0) {
      await supabaseAdmin
        .from("store_modules")
        .insert((modules as string[]).map((module_id: string) => ({
          store_id,
          module_id,
        })));
    }

    // Create invoice
    const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${store_id.slice(0, 4).toUpperCase()}`;
    await supabaseAdmin.from("invoices").insert({
      store_id,
      invoice_number: invoiceNumber,
      amount: Math.round(totalConverted),
      modules: modules as string[],
      status: "paid",
      issued_at: now.toISOString(),
      paid_at: now.toISOString(),
      period_start: now.toISOString().split("T")[0],
      period_end: renewalDate.toISOString().split("T")[0],
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription?.id,
        amount: totalConverted,
        currency,
        renewal_date: renewalDate.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
