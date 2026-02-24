import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATES_FROM_XOF: Record<string, number> = {
  XOF: 1,
  EUR: 1 / 655.957,
  USD: 1 / 600,
};

function convertFromXOF(amountXOF: number, target: string): number {
  const rate = RATES_FROM_XOF[target] || 1;
  return Math.round(amountXOF * rate * 100) / 100;
}

const modulesPrices: Record<string, number> = {
  extra_callers: 2000, extra_preparers: 2000, extra_drivers: 3000,
  custom_fields: 2000, custom_status: 2500, export: 3000,
  message_templates: 2000, customer_history: 3000, stock_auto: 5000,
  multi_delivery: 5000, call_center: 7000, warehouse_team: 7000,
  segmentation: 5000, campaigns: 7000, loyalty: 6000,
  geo_tracking: 10000, automations: 12000, api: 10000,
  multi_store: 15000, ai_assistant: 15000, embed_forms: 5000,
};

async function initiatePayDunya(
  supabaseAdmin: any,
  store_id: string,
  modules: string[],
  totalXOF: number,
  totalConverted: number,
  feeAmount: number,
  netAmount: number,
  currency: string,
  country: string | null,
  provider: string,
  providerData: any,
) {
  const now = new Date();

  // Create pending transaction first
  const { data: txn, error: txnErr } = await supabaseAdmin.from("transactions").insert({
    store_id,
    gross_amount: Math.round(totalConverted),
    net_amount: Math.round(netAmount),
    fee_amount: Math.round(feeAmount),
    currency: currency || "XOF",
    provider,
    country: country || null,
    status: "pending",
  }).select("id").single();

  if (txnErr) throw txnErr;

  // Build PayDunya checkout invoice
  const PAYDUNYA_MASTER_KEY = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
  const PAYDUNYA_PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
  const PAYDUNYA_TOKEN = Deno.env.get("PAYDUNYA_TOKEN")!;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const callbackUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

  const moduleNames = modules.map(id => id.replace(/_/g, " ")).join(", ");

  const invoicePayload = {
    invoice: {
      total_amount: Math.round(totalXOF), // PayDunya uses XOF
      description: `Abonnement Intramate – ${modules.length} module(s): ${moduleNames}`,
    },
    store: {
      name: "Intramate",
    },
    custom_data: {
      store_id,
      transaction_id: txn.id,
      modules: JSON.stringify(modules),
      currency,
      country: country || "",
    },
    actions: {
      callback_url: callbackUrl,
      return_url: `${supabaseUrl.replace('.supabase.co', '')}.lovable.app/dashboard/billing`,
      cancel_url: `${supabaseUrl.replace('.supabase.co', '')}.lovable.app/dashboard/billing`,
    },
  };

  // Use sandbox or live based on environment
  const apiBase = "https://app.paydunya.com/sandbox-api/v1";

  const paydunyaRes = await fetch(`${apiBase}/checkout-invoice/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": PAYDUNYA_MASTER_KEY,
      "PAYDUNYA-PRIVATE-KEY": PAYDUNYA_PRIVATE_KEY,
      "PAYDUNYA-TOKEN": PAYDUNYA_TOKEN,
    },
    body: JSON.stringify(invoicePayload),
  });

  const paydunyaData = await paydunyaRes.json();

  if (paydunyaData.response_code !== "00") {
    // Update transaction to failed
    await supabaseAdmin.from("transactions").update({ status: "failed" }).eq("id", txn.id);
    throw new Error(paydunyaData.response_text || "PayDunya invoice creation failed");
  }

  // Store PayDunya token as provider_reference
  await supabaseAdmin.from("transactions")
    .update({ provider_reference: paydunyaData.token })
    .eq("id", txn.id);

  return {
    payment_url: paydunyaData.response_text, // PayDunya returns checkout URL here
    transaction_id: txn.id,
    token: paydunyaData.token,
  };
}

async function activateSubscription(
  supabaseAdmin: any,
  store_id: string,
  modules: string[],
  totalConverted: number,
  currency: string,
  provider: string,
  country: string | null,
) {
  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  // Create/update subscription
  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      store_id,
      modules,
      amount: Math.round(totalConverted),
      currency: currency || "XOF",
      provider,
      country: country || null,
      status: "active",
      started_at: now.toISOString(),
      renewal_date: renewalDate.toISOString(),
    }, { onConflict: "store_id" })
    .select()
    .single();

  if (subError) {
    const { data: newSub, error: insertErr } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        store_id, modules,
        amount: Math.round(totalConverted),
        currency: currency || "XOF",
        provider, country: country || null,
        status: "active",
        started_at: now.toISOString(),
        renewal_date: renewalDate.toISOString(),
      })
      .select().single();
    if (insertErr) throw insertErr;
    return newSub;
  }
  return subscription;
}

async function activateModules(supabaseAdmin: any, store_id: string, modules: string[]) {
  await supabaseAdmin.from("store_modules").delete().eq("store_id", store_id);
  if (modules.length > 0) {
    await supabaseAdmin.from("store_modules").insert(
      modules.map((module_id: string) => ({ store_id, module_id }))
    );
  }
}

async function createInvoice(supabaseAdmin: any, store_id: string, modules: string[], totalConverted: number, status = "paid") {
  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${store_id.slice(0, 4).toUpperCase()}`;
  await supabaseAdmin.from("invoices").insert({
    store_id,
    invoice_number: invoiceNumber,
    amount: Math.round(totalConverted),
    modules,
    status,
    issued_at: now.toISOString(),
    paid_at: status === "paid" ? now.toISOString() : null,
    period_start: now.toISOString().split("T")[0],
    period_end: renewalDate.toISOString().split("T")[0],
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { store_id, provider, modules, currency, country } = await req.json();

    // Validate store membership
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("id").eq("user_id", userId).eq("store_id", store_id).limit(1);

    if (!role || role.length === 0) {
      return new Response(JSON.stringify({ error: "Not a member of this store" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider config
    const { data: providerData } = await supabaseAdmin
      .from("payment_providers").select("*").eq("name", provider).eq("is_active", true).single();

    if (!providerData) {
      return new Response(JSON.stringify({ error: "Provider not available" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate amounts
    const totalXOF = (modules as string[]).reduce((sum: number, id: string) => sum + (modulesPrices[id] || 0), 0);
    const totalConverted = convertFromXOF(totalXOF, currency || "XOF");
    const feeAmount = Math.round(totalConverted * (providerData.fee_percentage / 100) * 100) / 100;
    const netAmount = Math.round((totalConverted - feeAmount) * 100) / 100;

    // === PayDunya provider: redirect to checkout ===
    if (provider === "paydunya") {
      const result = await initiatePayDunya(
        supabaseAdmin, store_id, modules, totalXOF, totalConverted,
        feeAmount, netAmount, currency || "XOF", country || null, provider, providerData,
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Fallback: direct activation (for testing / other providers) ===
    const subscription = await activateSubscription(
      supabaseAdmin, store_id, modules, totalConverted, currency, provider, country,
    );

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

    await activateModules(supabaseAdmin, store_id, modules);
    await createInvoice(supabaseAdmin, store_id, modules, totalConverted);

    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

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
