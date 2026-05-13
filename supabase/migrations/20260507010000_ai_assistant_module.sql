-- =============================================
-- AI ASSISTANT MODULE
-- Conversational AI with store-context awareness.
-- Admins can ask questions about orders, revenue,
-- team and get intelligent answers powered by Claude.
-- =============================================

-- ── 1. Conversations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_store
  ON public.ai_conversations(store_id, updated_at DESC);

CREATE TRIGGER tr_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations"
  ON public.ai_conversations FOR ALL
  USING (user_id = auth.uid() AND public.has_role(store_id, 'admin'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(store_id, 'admin'));

-- ── 2. Messages ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content           TEXT NOT NULL,
  tokens_used       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation
  ON public.ai_messages(conversation_id, created_at ASC);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store admins read own messages"
  ON public.ai_messages FOR SELECT
  USING (
    public.has_role(store_id, 'admin')
    AND EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Store admins insert messages"
  ON public.ai_messages FOR INSERT
  WITH CHECK (
    public.has_role(store_id, 'admin')
    AND EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- ── 3. Usage tracking view ────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.ai_usage_summary AS
SELECT
  c.store_id,
  COUNT(DISTINCT c.id)                                                      AS total_conversations,
  COUNT(m.id) FILTER (WHERE m.role = 'user')                               AS total_questions,
  COALESCE(SUM(m.tokens_used), 0)                                           AS total_tokens,
  COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= now() - INTERVAL '7 days') AS convos_last_7d,
  MAX(m.created_at)                                                         AS last_activity
FROM public.ai_conversations c
LEFT JOIN public.ai_messages m ON m.conversation_id = c.id
GROUP BY c.store_id;

GRANT SELECT ON public.ai_usage_summary TO authenticated;
