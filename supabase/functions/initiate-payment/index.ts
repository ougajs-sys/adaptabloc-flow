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

const defaultModulesPrices: Record<string, number> = {
  extra_callers: 2000, extra_preparers: 2000, extra_drivers: 3000,
  custom_fields: 2000, custom_status: 2500, export: 3000,
  message_templates: 2000, customer_history: 3000, stock_auto: 5000,
  multi_delivery: 5000, call_center: 7000, warehouse_team: 7000,
  segmentation: 5000, campaigns: 7000, loyalty: 6000,
  geo_tracking: 10000, automations: 12000, api: 10000,
  multi_store: 15000, ai_assistant: 15000, embed_forms: 5000,
};

async function getModulePrices(supabaseAdmin: any): Promise<Record<string, number>> {
  const prices = { ...defaultModulesPrices };
  const { data } = await supabaseAdmin.from("module_pricing").select("module_id, price");
  if (data) {
    for (const row of data) {
      prices[row.module_id] = row.price;
    }
  }
  return prices;
}

function getFrontendUrl(): string {
  return Deno.env.get("FRONTEND_URL") || "https://cheerful-longma-30a8e7.netlify.app";
}

// ─── Moneroo ────────────────────────────────────────────────────────────────

async function initiateMoneroo(
  supabaseAdmin: any,
  store_id: string,
  modules: string[],
  totalXOF: number,
  totalConverted: number,
  feeAmount: number,
  netAmount: number,
  currency: string,
  country: string | null,
  userEmail: string,
  userName: string,
) {
  const { data: txn, error: txnErr } = await supabaseAdmin
    .from("transactions")
    .insert({
      store_id,
      gross_amount: Math.round(totalConverted),
      net_amount: Math.round(netAmount),
      fee_amount: Math.round(feeAmount),
      currency: currency || "XOF",
      provider: "moneroo",
      country: country || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (txnErr) throw txnErr;

  const MONEROO_SECRET_KEY = Deno.env.get("MONEROO_SECRET_KEY");
  if (!MONEROO_SECRET_KEY) throw new Error("MONEROO_SECRET_KEY not configured");

  const frontendUrl = getFrontendUrl();
  const moduleNames = modules.map((id) => id.replace(/_/g, " ")).join(", ");

  const nameParts = userName.trim().split(" ");
  const firstName = nameParts[0] || "Client";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const payload: Record<string, unknown> = {
    amount: Math.round(totalXOF), // Moneroo works in XOF for African market
    currency: "XOF",
    description: `Abonnement Intramate – ${modules.length} module(s): ${moduleNames}`,
    customer: {
      email: userEmail,
      first_name: firstName,
      last_name: lastName,
    },
    return_url: `${frontendUrl}/dashboard/billing`,
    metadata: {
      store_id,
      transaction_id: txn.id,
      modules: JSON.stringify(modules),
      currency,
      country: country || "",
    },
  };

  const res = await fetch("https://api.moneroo.io/v1/payments/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${MONEROO_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data?.data?.checkout_url) {
    await supabaseAdmin.from("transactions").update({ status: "failed" }).eq("id", txn.id);
    throw new Error(data?.message || `Moneroo error ${res.status}`);
  }

  // Store Moneroo payment ID as provider_reference for webhook lookup
  await supabaseAdmin
    .from("transactions")
    .update({ provider_reference: data.data.id })
    .eq("id", txn.id);

  return {
    payment_url: data.data.checkout_url,
    transaction_id: txn.id,
    moneroo_id: data.data.id,
  };
}

// ─── PayDunya ───────────────────────────────────────────────────────────────

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
) {
  const { data: txn, error: txnErr } = await supabaseAdmin
    .from("transactions")
    .insert({
      store_id,
      gross_amount: Math.round(totalConverted),
      net_amount: Math.round(netAmount),
      fee_amount: Math.round(feeAmount),
      currency: currency || "XOF",
      provider: "paydunya",
      country: country || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (txnErr) throw txnErr;

  const PAYDUNYA_MASTER_KEY = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
  const PAYDUNYA_PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
  const PAYDUNYA_TOKEN = Deno.env.get("PAYDUNYA_TOKEN")!;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const frontendUrl = getFrontendUrl();
  const moduleNames = modules.map((id) => id.replace(/_/g, " ")).join(", ");

  const invoicePayload = {
    invoice: {
      total_amount: Math.round(totalXOF),
      description: `Abonnement Intramate – ${modules.length} module(s): ${moduleNames}`,
    },
    store: { name: "Intramate" },
    custom_data: {
      store_id,
      transaction_id: txn.id,
      modules: JSON.stringify(modules),
      currency,
      country: country || "",
    },
    actions: {
      callback_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      return_url: `${frontendUrl}/dashboard/billing`,
      cancel_url: `${frontendUrl}/dashboard/billing`,
    },
  };

  const paydunyaRes = await fetch("https://app.paydunya.com/api/v1/checkout-invoice/create", {
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
    await supabaseAdmin.from("transactions").update({ status: "failed" }).eq("id", txn.id);
    throw new Error(paydunyaData.response_text || "PayDunya invoice creation failed");
  }

  await supabaseAdmin
    .from("transactions")
    .update({ provider_reference: paydunyaData.token })
    .eq("id", txn.id);

  return {
    payment_url: paydunyaData.response_text,
    transaction_id: txn.id,
    token: paydunyaData.token,
  };
}

// ─── Subscription helpers ────────────────────────────────────────────────────

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

  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      store_id, modules,
      amount: Math.round(totalConverted),
      currency: currency || "XOF",
      provider, country: country || null,
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
      .select()
      .single();
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

async function createInvoice(
  supabaseAdmin: any,
  store_id: string,
  modules: string[],
  totalConverted: number,
  status = "paid",
) {
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

// ─── Main handler ────────────────────────────────────────────────────────────

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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // Verify user identity (fixed: was using non-existent getClaims API)
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    const userEmail = user.email || "";
    const userName = (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      userEmail.split("@")[0] ||
      "Client";

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
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate amounts
    const modulesPrices = await getModulePrices(supabaseAdmin);
    const totalXOF = (modules as string[]).reduce(
      (sum: number, id: string) => sum + (modulesPrices[id] || 0), 0
    );
    const totalConverted = convertFromXOF(totalXOF, currency || "XOF");
    const feeAmount = Math.round(totalConverted * (providerData.fee_percentage / 100) * 100) / 100;
    const netAmount = Math.round((totalConverted - feeAmount) * 100) / 100;

    // ── Moneroo ──
    if (provider === "moneroo") {
      const result = await initiateMoneroo(
        supabaseAdmin, store_id, modules,
        totalXOF, totalConverted, feeAmount, netAmount,
        currency || "XOF", country || null,
        userEmail, userName,
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PayDunya ──
    if (provider === "paydunya") {
      const result = await initiatePayDunya(
        supabaseAdmin, store_id, modules,
        totalXOF, totalConverted, feeAmount, netAmount,
        currency || "XOF", country || null,
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fallback: direct activation (testing / manual providers) ──
    const subscription = await activateSubscription(
      supabaseAdmin, store_id, modules, totalConverted, currency, provider, country,
    );

    await supabaseAdmin.from("transactions").insert({
      store_id,
      gross_amount: Math.round(totalConverted),
      net_amount: Math.round(netAmount),
      fee_amount: Math.round(feeAmount),
      currency: currency || "XOF",
      provider, country: country || null,
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
