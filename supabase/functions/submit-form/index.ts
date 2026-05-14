
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const { formId, data } = body as { formId?: unknown; data?: unknown }
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (typeof formId !== 'string' || !UUID_RE.test(formId)) {
      return new Response(JSON.stringify({ error: 'Invalid formId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return new Response(JSON.stringify({ error: 'Invalid data payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const dataObj = data as Record<string, unknown>
    if (Object.keys(dataObj).length > 50) {
      return new Response(JSON.stringify({ error: 'Too many fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const clean = (v: unknown, max: number) => {
      if (v === undefined || v === null) return undefined
      const s = String(v).trim().slice(0, max)
      return s.length ? s : undefined
    }
    const validatePhone = (v: unknown) => {
      const s = clean(v, 30)
      if (!s) return undefined
      const digits = s.replace(/[^0-9+]/g, '')
      return digits.length >= 6 && digits.length <= 20 ? digits : undefined
    }
    const validateEmail = (v: unknown) => {
      const s = clean(v, 255)
      if (!s) return undefined
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s.toLowerCase() : undefined
    }
    const sanitizeLike = (s: string) => s.replace(/[%_\\]/g, '\\$&').slice(0, 100)

    // 1. Fetch form
    const { data: form, error: formError } = await supabaseClient
      .from('embed_forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: 'Form not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (form.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Form is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Extract customer info
    // We try to match standard fields or look for "phone", "email", "name" in keys (case insensitive)
    const findValue = (keys: string[]) => {
      const key = Object.keys(dataObj).find(k => keys.includes(k.toLowerCase()));
      return key ? dataObj[key] : undefined;
    }

    const phone = validatePhone(findValue(['phone', 'téléphone', 'telephone', 'mobile']));
    const email = validateEmail(findValue(['email', 'e-mail', 'mail']));
    const name = clean(findValue(['name', 'nom', 'nom complet', 'fullname']), 150) || 'Client Formulaire';
    const address = clean(findValue(['address', 'adresse', 'lieu de livraison']), 500) || '';

    let customerId: string | undefined;

    if (phone) {
      const { data: existing } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('store_id', form.store_id)
        .eq('phone', phone)
        .maybeSingle()
      if (existing) customerId = existing.id
    }

    if (!customerId && email) {
      const { data: existing } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('store_id', form.store_id)
        .eq('email', email)
        .maybeSingle()
      if (existing) customerId = existing.id
    }

    if (!customerId) {
      const { data: newCustomer, error: createError } = await supabaseClient
        .from('customers')
        .insert({
          store_id: form.store_id,
          name,
          phone,
          email,
          address,
          source: 'form_embed',
          segment: 'new'
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Customer creation failed:', createError)
        throw new Error('Failed to create customer profile')
      }
      customerId = newCustomer.id
    }

    // 3. Create Order
    const productValue = clean(findValue(['product', 'produit', 'article']), 200);
    const quantityRaw = findValue(['quantity', 'quantité', 'qte']);
    const quantityNum = parseInt(String(quantityRaw ?? 1));
    const quantity = Number.isFinite(quantityNum) && quantityNum >= 1 && quantityNum <= 1000 ? quantityNum : 1;

    // Order number
    const orderNumber = `CMD-${Date.now().toString().slice(-6)}`

    // Create order header
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        store_id: form.store_id,
        customer_id: customerId,
        order_number: orderNumber,
        status: 'new',
        source: 'form_embed',
        shipping_address: address,
        notes: `Commande via formulaire "${form.name}"`
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Order creation failed:', orderError)
      throw new Error('Failed to create order')
    }

    // 4. Add items if product info exists
    if (productValue) {
      // Try to find product in store
      const { data: products } = await supabaseClient
        .from('products')
        .select('id, name, price')
        .eq('store_id', form.store_id)
        .ilike('name', `%${sanitizeLike(productValue)}%`)
        .limit(1)

      const product = products?.[0];

      if (!product) {
        // Product name provided but not found in catalog — record as unpriced item for manual review
        console.warn(`submit-form: product not found for name "${productValue}", order ${order.id} created without price`);
        await supabaseClient.from('order_items').insert({
          order_id: order.id,
          product_id: null,
          product_name: String(productValue),
          quantity,
          unit_price: 0,
          total_price: 0,
        });
        // Do NOT update total_amount — leave it at 0 (needs manual pricing)
      } else {
        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;

        const { error: itemError } = await supabaseClient
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
          })

        if (itemError) {
          console.error('Order item creation failed:', itemError)
          throw new Error('Failed to create order item')
        }

        const { error: totalError } = await supabaseClient
          .from('orders')
          .update({ total_amount: totalPrice })
          .eq('id', order.id)

        if (totalError) {
          console.error('Total amount update failed:', totalError)
          throw new Error('Failed to update order total')
        }
      }
    }

    // 5. Update stats
    await supabaseClient
      .from('embed_forms')
      .update({ 
        submissions_count: (form.submissions_count || 0) + 1,
        conversions_count: (form.conversions_count || 0) + 1 
      })
      .eq('id', formId)

    const successMessage = (form.style as any)?.successMessage || 'Commande enregistrée avec succès';

    return new Response(
      JSON.stringify({ success: true, message: successMessage, orderId: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
