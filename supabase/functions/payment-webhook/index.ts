import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modulesPrices: Record<string, number> = {
  extra_callers: 2000, extra_preparers: 2000, extra_drivers: 3000,
  custom_fields: 2000, custom_status: 2500, export: 3000,
  message_templates: 2000, customer_history: 3000, stock_auto: 5000,
  multi_delivery: 5000, call_center: 7000, warehouse_team: 7000,
  segmentation: 5000, campaigns: 7000, loyalty: 6000,
  geo_tracking: 10000, automations: 12000, api: 10000,
  multi_store: 15000, ai_assistant: 15000, embed_forms: 5000,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === PayDunya IPN format ===
    // PayDunya sends: { response_code, response_text, hash, custom_data, invoice, actions, ... }
    if (body.response_code !== undefined) {
      return await handlePayDunyaIPN(body, supabaseAdmin);
    }

    // === Generic webhook format (legacy) ===
    const { provider, event, transaction_id, status, store_id } = body;

    if (status === "completed" || status === "success") {
      if (transaction_id) {
        await supabaseAdmin.from("transactions")
          .update({ status: "completed" }).eq("provider_reference", transaction_id);
      }

      if (event === "renewal" && store_id) {
        const { data: sub } = await supabaseAdmin.from("subscriptions")
          .select("*").eq("store_id", store_id).eq("status", "active").single();

        if (sub) {
          const newRenewal = new Date(sub.renewal_date || new Date());
          newRenewal.setMonth(newRenewal.getMonth() + 1);
          await supabaseAdmin.from("subscriptions").update({
            renewal_date: newRenewal.toISOString(),
            grace_until: null, status: "active",
          }).eq("id", sub.id);
        }
      }
    }

    if (status === "failed" && store_id) {
      const { data: sub } = await supabaseAdmin.from("subscriptions")
        .select("*").eq("store_id", store_id).eq("status", "active").single();

      if (sub) {
        const graceUntil = new Date();
        graceUntil.setDate(graceUntil.getDate() + 3);
        await supabaseAdmin.from("subscriptions").update({
          status: "grace", grace_until: graceUntil.toISOString(),
        }).eq("id", sub.id);

        if (transaction_id) {
          await supabaseAdmin.from("transactions")
            .update({ status: "failed" }).eq("provider_reference", transaction_id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handlePayDunyaIPN(body: any, supabaseAdmin: any) {
  const customData = body.custom_data || {};
  const store_id = customData.store_id;
  const transaction_id = customData.transaction_id;
  const modulesRaw = customData.modules;
  const currency = customData.currency || "XOF";
  const country = customData.country || null;

  if (!store_id || !transaction_id) {
    return new Response(JSON.stringify({ error: "Missing custom_data" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const modules: string[] = modulesRaw ? JSON.parse(modulesRaw) : [];

  // Verify payment hash with PayDunya
  const PAYDUNYA_MASTER_KEY = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
  const PAYDUNYA_PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
  const PAYDUNYA_TOKEN = Deno.env.get("PAYDUNYA_TOKEN")!;

  // Confirm the invoice status via PayDunya API
  const paydunyaToken = body.invoice?.token || body.token;
  if (paydunyaToken) {
    const apiBase = "https://app.paydunya.com/sandbox-api/v1";
    const confirmRes = await fetch(`${apiBase}/checkout-invoice/confirm/${paydunyaToken}`, {
      headers: {
        "PAYDUNYA-MASTER-KEY": PAYDUNYA_MASTER_KEY,
        "PAYDUNYA-PRIVATE-KEY": PAYDUNYA_PRIVATE_KEY,
        "PAYDUNYA-TOKEN": PAYDUNYA_TOKEN,
      },
    });
    const confirmData = await confirmRes.json();

    if (confirmData.status !== "completed") {
      // Payment not completed — mark transaction failed
      await supabaseAdmin.from("transactions")
        .update({ status: "failed" }).eq("id", transaction_id);
      return new Response(JSON.stringify({ received: true, status: "not_completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Payment confirmed — activate everything
  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  // Update transaction to completed
  await supabaseAdmin.from("transactions")
    .update({ status: "completed" }).eq("id", transaction_id);

  // Get transaction for amounts
  const { data: txn } = await supabaseAdmin.from("transactions")
    .select("*").eq("id", transaction_id).single();

  const totalConverted = txn?.gross_amount || 0;

  // Upsert subscription
  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      store_id,
      modules,
      amount: totalConverted,
      currency,
      provider: "paydunya",
      country,
      status: "active",
      started_at: now.toISOString(),
      renewal_date: renewalDate.toISOString(),
    }, { onConflict: "store_id" })
    .select().single();

  if (subError) {
    await supabaseAdmin.from("subscriptions").insert({
      store_id, modules, amount: totalConverted, currency,
      provider: "paydunya", country, status: "active",
      started_at: now.toISOString(), renewal_date: renewalDate.toISOString(),
    });
  }

  // Update transaction with subscription_id
  if (subscription?.id) {
    await supabaseAdmin.from("transactions")
      .update({ subscription_id: subscription.id }).eq("id", transaction_id);
  }

  // Activate modules
  await supabaseAdmin.from("store_modules").delete().eq("store_id", store_id);
  if (modules.length > 0) {
    await supabaseAdmin.from("store_modules").insert(
      modules.map((module_id: string) => ({ store_id, module_id }))
    );
  }

  // Create invoice
  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${store_id.slice(0, 4).toUpperCase()}`;
  await supabaseAdmin.from("invoices").insert({
    store_id,
    invoice_number: invoiceNumber,
    amount: totalConverted,
    modules,
    status: "paid",
    issued_at: now.toISOString(),
    paid_at: now.toISOString(),
    period_start: now.toISOString().split("T")[0],
    period_end: renewalDate.toISOString().split("T")[0],
  });

  return new Response(JSON.stringify({ received: true, status: "activated" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
