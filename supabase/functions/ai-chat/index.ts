import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  conversation_id: string
  store_id: string
  messages: Message[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: RequestBody = await req.json()
    const { conversation_id, store_id, messages } = body

    if (!conversation_id || !store_id || !messages?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user has admin role for this store
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', store_id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch store context for system prompt
    const today = new Date().toISOString().split('T')[0]
    const [storeRes, ordersRes, revenueRes] = await Promise.all([
      supabase.from('stores').select('name, phone, email').eq('id', store_id).single(),
      supabase.from('orders').select('status, created_at').eq('store_id', store_id)
        .gte('created_at', `${today}T00:00:00Z`),
      supabase.from('orders').select('total_price, status').eq('store_id', store_id)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ])

    const store = storeRes.data
    const todayOrders = ordersRes.data ?? []
    const monthOrders = revenueRes.data ?? []

    const todayCount = todayOrders.length
    const pendingCount = todayOrders.filter(o => o.status === 'pending').length
    const confirmedCount = todayOrders.filter(o => o.status === 'confirmed').length
    const monthRevenue = monthOrders
      .filter(o => ['confirmed', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_price ?? 0), 0)

    const systemPrompt = `Tu es un assistant IA intelligent et bienveillant pour la boutique "${store?.name ?? 'votre boutique'}".
Tu aides les gérants à comprendre leurs données, prendre de meilleures décisions et optimiser leurs opérations.

CONTEXTE ACTUEL DE LA BOUTIQUE :
- Date d'aujourd'hui : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
- Commandes aujourd'hui : ${todayCount} (${pendingCount} en attente, ${confirmedCount} confirmées)
- Chiffre d'affaires du mois (30j) : ${monthRevenue.toLocaleString('fr-FR')} FCFA

INSTRUCTIONS :
- Réponds toujours en français
- Sois concis, précis et actionnable
- Si tu manques de données pour répondre, explique ce dont tu aurais besoin
- Tu peux suggérer des actions concrètes basées sur les données disponibles
- Ne fais jamais de suppositions sur des données que tu n'as pas`

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured. Please set ANTHROPIC_API_KEY in Supabase secrets.' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Call Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      return new Response(JSON.stringify({ error: 'AI API error', detail: err }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const claudeData = await claudeRes.json()
    const assistantContent = claudeData.content?.[0]?.text ?? ''
    const tokensUsed = claudeData.usage?.output_tokens ?? 0

    // Persist assistant message
    await supabase.from('ai_messages').insert({
      conversation_id,
      store_id,
      role: 'assistant',
      content: assistantContent,
      tokens_used: tokensUsed,
    })

    // Update conversation updated_at
    await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation_id)

    return new Response(JSON.stringify({ content: assistantContent, tokens_used: tokensUsed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
