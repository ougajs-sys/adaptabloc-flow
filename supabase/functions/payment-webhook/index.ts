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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Moneroo webhook ──
    // Moneroo sends: { id, status, metadata, amount, currency, ... }
    if (body.id && body.status && body.metadata !== undefined) {
      return await handleMonerooWebhook(body, supabaseAdmin);
    }

    // ── PayDunya IPN ──
    // PayDunya sends: { response_code, response_text, hash, custom_data, ... }
    if (body.response_code !== undefined) {
      return await handlePayDunyaIPN(body, supabaseAdmin);
    }

    // ── Generic legacy webhook ──
    const { event, transaction_id, status, store_id } = body;

    if (status === "completed" || status === "success") {
      if (transaction_id) {
        await supabaseAdmin
          .from("transactions")
          .update({ status: "completed" })
          .eq("provider_reference", transaction_id);
      }

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
          await supabaseAdmin.from("subscriptions").update({
            renewal_date: newRenewal.toISOString(),
            grace_until: null,
            status: "active",
          }).eq("id", sub.id);
        }
      }
    }

    if (status === "failed" && store_id) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("store_id", store_id)
        .eq("status", "active")
        .single();

      if (sub) {
        const graceUntil = new Date();
        graceUntil.setDate(graceUntil.getDate() + 3);
        await supabaseAdmin.from("subscriptions").update({
          status: "grace",
          grace_until: graceUntil.toISOString(),
        }).eq("id", sub.id);

        if (transaction_id) {
          await supabaseAdmin
            .from("transactions")
            .update({ status: "failed" })
            .eq("provider_reference", transaction_id);
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

// ─── Moneroo webhook handler ─────────────────────────────────────────────────

async function handleMonerooWebhook(body: any, supabaseAdmin: any) {
  const monerooPaymentId = body.id;
  const metadata = body.metadata || {};

  const store_id = metadata.store_id;
  const transaction_id = metadata.transaction_id;
  const modulesRaw = metadata.modules;
  const currency = metadata.currency || "XOF";
  const country = metadata.country || null;

  if (!store_id || !transaction_id) {
    return new Response(JSON.stringify({ error: "Missing metadata" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const modules: string[] = modulesRaw ? JSON.parse(modulesRaw) : [];

  // Verify payment status with Moneroo API
  const MONEROO_SECRET_KEY = Deno.env.get("MONEROO_SECRET_KEY")!;
  const verifyRes = await fetch(`https://api.moneroo.io/v1/payments/${monerooPaymentId}/verify`, {
    headers: {
      "Authorization": `Bearer ${MONEROO_SECRET_KEY}`,
      "Accept": "application/json",
    },
  });

  const verifyData = await verifyRes.json();
  const confirmedStatus = verifyData?.data?.status || body.status;

  if (confirmedStatus !== "success") {
    await supabaseAdmin
      .from("transactions")
      .update({ status: confirmedStatus === "cancelled" ? "cancelled" : "failed" })
      .eq("id", transaction_id);

    // Put subscription in grace period if payment failed
    if (confirmedStatus === "failed" || confirmedStatus === "cancelled") {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("store_id", store_id)
        .eq("status", "active")
        .single();

      if (sub) {
        const graceUntil = new Date();
        graceUntil.setDate(graceUntil.getDate() + 3);
        await supabaseAdmin.from("subscriptions").update({
          status: "grace",
          grace_until: graceUntil.toISOString(),
        }).eq("id", sub.id);
      }
    }

    return new Response(
      JSON.stringify({ received: true, status: confirmedStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Payment confirmed — activate subscription and modules
  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  // Mark transaction as completed
  await supabaseAdmin
    .from("transactions")
    .update({ status: "completed" })
    .eq("id", transaction_id);

  // Get transaction amounts
  const { data: txn } = await supabaseAdmin
    .from("transactions")
    .select("gross_amount")
    .eq("id", transaction_id)
    .single();
  const totalAmount = txn?.gross_amount || 0;

  // Upsert subscription
  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      store_id, modules,
      amount: totalAmount,
      currency,
      provider: "moneroo",
      country,
      status: "active",
      started_at: now.toISOString(),
      renewal_date: renewalDate.toISOString(),
    }, { onConflict: "store_id" })
    .select()
    .single();

  if (subError) {
    await supabaseAdmin.from("subscriptions").insert({
      store_id, modules, amount: totalAmount, currency,
      provider: "moneroo", country, status: "active",
      started_at: now.toISOString(), renewal_date: renewalDate.toISOString(),
    });
  }

  if (subscription?.id) {
    await supabaseAdmin
      .from("transactions")
      .update({ subscription_id: subscription.id })
      .eq("id", transaction_id);
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
    amount: totalAmount,
    modules,
    status: "paid",
    issued_at: now.toISOString(),
    paid_at: now.toISOString(),
    period_start: now.toISOString().split("T")[0],
    period_end: renewalDate.toISOString().split("T")[0],
  });

  return new Response(
    JSON.stringify({ received: true, status: "activated" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

// ─── PayDunya IPN handler ────────────────────────────────────────────────────

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

  const PAYDUNYA_MASTER_KEY = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
  const PAYDUNYA_PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
  const PAYDUNYA_TOKEN = Deno.env.get("PAYDUNYA_TOKEN")!;

  const paydunyaToken = body.invoice?.token || body.token;
  if (paydunyaToken) {
    const confirmRes = await fetch(
      `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${paydunyaToken}`,
      {
        headers: {
          "PAYDUNYA-MASTER-KEY": PAYDUNYA_MASTER_KEY,
          "PAYDUNYA-PRIVATE-KEY": PAYDUNYA_PRIVATE_KEY,
          "PAYDUNYA-TOKEN": PAYDUNYA_TOKEN,
        },
      },
    );
    const confirmData = await confirmRes.json();

    if (confirmData.status !== "completed") {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction_id);
      return new Response(
        JSON.stringify({ received: true, status: "not_completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  await supabaseAdmin
    .from("transactions")
    .update({ status: "completed" })
    .eq("id", transaction_id);

  const { data: txn } = await supabaseAdmin
    .from("transactions")
    .select("gross_amount")
    .eq("id", transaction_id)
    .single();
  const totalConverted = txn?.gross_amount || 0;

  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      store_id, modules, amount: totalConverted, currency,
      provider: "paydunya", country, status: "active",
      started_at: now.toISOString(), renewal_date: renewalDate.toISOString(),
    }, { onConflict: "store_id" })
    .select()
    .single();

  if (subError) {
    await supabaseAdmin.from("subscriptions").insert({
      store_id, modules, amount: totalConverted, currency,
      provider: "paydunya", country, status: "active",
      started_at: now.toISOString(), renewal_date: renewalDate.toISOString(),
    });
  }

  if (subscription?.id) {
    await supabaseAdmin
      .from("transactions")
      .update({ subscription_id: subscription.id })
      .eq("id", transaction_id);
  }

  await supabaseAdmin.from("store_modules").delete().eq("store_id", store_id);
  if (modules.length > 0) {
    await supabaseAdmin.from("store_modules").insert(
      modules.map((module_id: string) => ({ store_id, module_id }))
    );
  }

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

  return new Response(
    JSON.stringify({ received: true, status: "activated" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
