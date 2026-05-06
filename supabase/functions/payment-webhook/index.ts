import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── HMAC-SHA256 helper (Deno WebCrypto) ──────────────────────────────────────
async function computeHmacSha256(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read raw body text first (needed for HMAC verification)
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Moneroo webhook ──
    // Moneroo sends: { id, status, metadata, amount, currency, ... }
    // Signature: X-Moneroo-Signature = HMAC-SHA256(MONEROO_WEBHOOK_SECRET, rawBody)
    if (body.id && body.status && body.metadata !== undefined) {
      const webhookSecret = Deno.env.get("MONEROO_WEBHOOK_SECRET");
      if (webhookSecret) {
        const receivedSig = req.headers.get("x-moneroo-signature") || "";
        const expectedSig = await computeHmacSha256(webhookSecret, rawBody);
        if (!secureCompare(receivedSig, expectedSig)) {
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      return await handleMonerooWebhook(body, supabaseAdmin);
    }

    // ── PayDunya IPN ──
    // PayDunya sends: { response_code, response_text, hash, custom_data, ... }
    // Verification is done server-to-server via the confirm endpoint (more robust than hash check)
    if (body.response_code !== undefined) {
      return await handlePayDunyaIPN(body, supabaseAdmin);
    }

    // ── Chariow webhook ──
    // Chariow sends: { id, event, data: { ... }, created_at }
    // Signature header: x-chariow-signature = HMAC-SHA256(CHARIOW_WEBHOOK_SECRET, rawBody)
    if (body.event && (body.data || body.payload)) {
      const webhookSecret = Deno.env.get("CHARIOW_WEBHOOK_SECRET");
      let signatureValid = !webhookSecret; // if no secret configured, treat as not-checked (true for processing)
      if (webhookSecret) {
        const receivedSig = req.headers.get("x-chariow-signature") ||
          req.headers.get("chariow-signature") || "";
        const expectedSig = await computeHmacSha256(webhookSecret, rawBody);
        signatureValid = secureCompare(receivedSig, expectedSig);
        if (!signatureValid) {
          // Log the event but reject
          await supabaseAdmin.from("chariow_webhook_events").insert({
            event_id: String(body.id || crypto.randomUUID()),
            event_type: String(body.event),
            payload: body,
            signature_valid: false,
            error: "Invalid signature",
          }).select().maybeSingle();
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      return await handleChariowWebhook(body, supabaseAdmin, signatureValid);
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

  // ── Idempotency: skip if transaction already completed ──
  const { data: existingTxn } = await supabaseAdmin
    .from("transactions")
    .select("status")
    .eq("id", transaction_id)
    .maybeSingle();

  if (existingTxn?.status === "completed") {
    return new Response(JSON.stringify({ received: true, status: "already_processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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

  // Create invoice (unique number: year-month-store-txnSuffix)
  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${store_id.slice(0, 4).toUpperCase()}-${transaction_id.slice(-6).toUpperCase()}`;
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

  // ── Idempotency: skip if transaction already completed ──
  const { data: existingTxn } = await supabaseAdmin
    .from("transactions")
    .select("status")
    .eq("id", transaction_id)
    .maybeSingle();

  if (existingTxn?.status === "completed") {
    return new Response(JSON.stringify({ received: true, status: "already_processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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

  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${store_id.slice(0, 4).toUpperCase()}-${transaction_id.slice(-6).toUpperCase()}`;
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

// ─── Chariow webhook handler ─────────────────────────────────────────────────
// Handles sale.completed (license issuance) and license.* events.
// Persists every event for idempotency (event_id is UNIQUE) and debugging.

async function handleChariowWebhook(body: any, supabaseAdmin: any, signatureValid: boolean) {
  const eventId = String(body.id || body.event_id || crypto.randomUUID());
  const eventType = String(body.event || body.type || "unknown");
  const data = body.data || body.payload || {};

  const { error: insertErr } = await supabaseAdmin
    .from("chariow_webhook_events")
    .insert({
      event_id: eventId,
      event_type: eventType,
      payload: body,
      signature_valid: signatureValid,
    });

  if (insertErr && insertErr.code === "23505") {
    return new Response(
      JSON.stringify({ received: true, status: "duplicate" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    if (eventType === "sale.completed" || eventType === "checkout.completed") {
      await processChariowSale(data, supabaseAdmin);
    } else if (eventType === "sale.failed" || eventType === "checkout.failed") {
      await processChariowFailure(data, supabaseAdmin);
    } else if (eventType === "license.activated" || eventType === "license.renewed") {
      await processChariowLicenseRenewal(data, supabaseAdmin);
    } else if (eventType === "license.revoked" || eventType === "subscription.cancelled") {
      await processChariowLicenseRevocation(data, supabaseAdmin);
    }

    await supabaseAdmin
      .from("chariow_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", eventId);
  } catch (err: any) {
    await supabaseAdmin
      .from("chariow_webhook_events")
      .update({ error: err?.message || String(err) })
      .eq("event_id", eventId);
    throw err;
  }

  return new Response(
    JSON.stringify({ received: true, status: "processed", event: eventType }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function processChariowSale(data: any, supabaseAdmin: any) {
  const metadata = data.metadata || {};
  const store_id = metadata.store_id;
  const transaction_id = metadata.transaction_id;
  const modulesRaw = metadata.modules;
  const currency = metadata.currency || "XOF";
  const country = metadata.country || null;
  const licenseKey = data.license_key || data.license?.key || null;
  const productId = data.product_id || data.product?.id || null;

  if (!store_id || !transaction_id) {
    throw new Error("Chariow sale missing store_id/transaction_id metadata");
  }

  const { data: existingTxn } = await supabaseAdmin
    .from("transactions")
    .select("status")
    .eq("id", transaction_id)
    .maybeSingle();
  if (existingTxn?.status === "completed") return;

  const modules: string[] = modulesRaw ? JSON.parse(modulesRaw) : [];
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
  const totalAmount = txn?.gross_amount || 0;

  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      store_id,
      modules,
      amount: totalAmount,
      currency,
      provider: "chariow",
      country,
      status: "active",
      started_at: now.toISOString(),
      renewal_date: renewalDate.toISOString(),
      chariow_license_key: licenseKey,
      chariow_product_id: productId,
      chariow_activated_at: now.toISOString(),
      chariow_last_validated_at: now.toISOString(),
    }, { onConflict: "store_id" })
    .select()
    .single();

  if (subError) {
    await supabaseAdmin.from("subscriptions").insert({
      store_id, modules, amount: totalAmount, currency,
      provider: "chariow", country, status: "active",
      started_at: now.toISOString(), renewal_date: renewalDate.toISOString(),
      chariow_license_key: licenseKey,
      chariow_product_id: productId,
      chariow_activated_at: now.toISOString(),
      chariow_last_validated_at: now.toISOString(),
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

  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${store_id.slice(0, 4).toUpperCase()}-${transaction_id.slice(-6).toUpperCase()}`;
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
}

async function processChariowFailure(data: any, supabaseAdmin: any) {
  const metadata = data.metadata || {};
  const store_id = metadata.store_id;
  const transaction_id = metadata.transaction_id;
  if (!transaction_id) return;

  await supabaseAdmin
    .from("transactions")
    .update({ status: "failed" })
    .eq("id", transaction_id);

  if (store_id) {
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("store_id", store_id)
      .eq("status", "active")
      .maybeSingle();
    if (sub) {
      const graceUntil = new Date();
      graceUntil.setDate(graceUntil.getDate() + 3);
      await supabaseAdmin.from("subscriptions").update({
        status: "grace",
        grace_until: graceUntil.toISOString(),
      }).eq("id", sub.id);
    }
  }
}

async function processChariowLicenseRenewal(data: any, supabaseAdmin: any) {
  const licenseKey = data.license_key || data.license?.key || data.key;
  if (!licenseKey) return;
  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      grace_until: null,
      renewal_date: renewalDate.toISOString(),
      chariow_last_validated_at: now.toISOString(),
    })
    .eq("chariow_license_key", licenseKey);
}

async function processChariowLicenseRevocation(data: any, supabaseAdmin: any) {
  const licenseKey = data.license_key || data.license?.key || data.key;
  if (!licenseKey) return;
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("chariow_license_key", licenseKey);

  const { data: subs } = await supabaseAdmin
    .from("subscriptions")
    .select("store_id")
    .eq("chariow_license_key", licenseKey);
  for (const sub of subs || []) {
    await supabaseAdmin.from("store_modules").delete().eq("store_id", sub.store_id);
  }
}
