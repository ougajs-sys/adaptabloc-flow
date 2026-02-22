
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

    const { formId, data } = await req.json()

    if (!formId) {
      throw new Error('Form ID is required')
    }

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
      const key = Object.keys(data).find(k => keys.includes(k.toLowerCase()));
      return key ? data[key] : undefined;
    }

    const phone = findValue(['phone', 'téléphone', 'telephone', 'mobile']);
    const email = findValue(['email', 'e-mail', 'mail']);
    const name = findValue(['name', 'nom', 'nom complet', 'fullname']) || 'Client Formulaire';
    const address = findValue(['address', 'adresse', 'lieu de livraison']) || '';
    
    let customerId: string | undefined;

    // Search existing customer
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

    // Create customer if needed
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
    // Try to find product info
    const productValue = findValue(['product', 'produit', 'article']);
    const quantityValue = findValue(['quantity', 'quantité', 'qte']) || 1;
    const quantity = parseInt(String(quantityValue)) || 1;

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
        .ilike('name', `%${productValue}%`)
        .limit(1)

      const product = products?.[0];
      const unitPrice = product ? product.price : 0;
      const totalPrice = unitPrice * quantity;

      await supabaseClient
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product?.id,
          product_name: product ? product.name : String(productValue),
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice
        })

      // Update total amount on order
      await supabaseClient
        .from('orders')
        .update({ total_amount: totalPrice })
        .eq('id', order.id)
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
