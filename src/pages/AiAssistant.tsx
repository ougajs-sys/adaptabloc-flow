import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Bot, Send, Plus, Trash2, Lock, Sparkles, MessageSquare,
  TrendingUp, ShoppingCart, Users, Loader2, CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: "Résumé du jour", prompt: "Donne-moi un résumé de l'activité d'aujourd'hui : commandes, revenus, et points d'attention." },
  { icon: ShoppingCart, label: "Commandes en attente", prompt: "Combien de commandes sont en attente de confirmation ? Que dois-je prioriser ?" },
  { icon: Users, label: "Performance équipe", prompt: "Comment performe mon équipe cette semaine ? Y a-t-il des points à améliorer ?" },
  { icon: Sparkles, label: "Conseils", prompt: "Quelles sont tes recommandations pour améliorer mes ventes ce mois-ci ?" },
];

function MessageBubble({ msg }: { msg: AiMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
        isUser ? "bg-primary text-primary-foreground" : "bg-violet-500/10",
      )}>
        {isUser
          ? <span className="text-xs font-bold">Moi</span>
          : <Bot size={16} className="text-violet-500" />}
      </div>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-muted rounded-tl-sm",
      )}>
        {msg.content}
        <p className={cn(
          "text-[10px] mt-1.5 opacity-60",
          isUser ? "text-right" : "text-left",
        )}>
          {format(new Date(msg.created_at), "HH:mm", { locale: fr })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 mt-1">
        <Bot size={16} className="text-violet-500" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AiAssistant() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const moduleEnabled = hasModule("ai_assistant");

  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<AiMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [localMessages, isTyping]);

  // Conversations list
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["ai-conversations", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("ai_conversations" as any) as any)
        .select("id, title, created_at, updated_at")
        .eq("store_id", storeId!)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });

  // Messages for active conversation
  const { data: savedMessages = [] } = useQuery<AiMessage[]>({
    queryKey: ["ai-messages", activeConvoId],
    enabled: !!activeConvoId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("ai_messages" as any) as any)
        .select("id, role, content, created_at")
        .eq("conversation_id", activeConvoId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AiMessage[];
    },
  });

  useEffect(() => {
    setLocalMessages(savedMessages);
  }, [savedMessages]);

  // Create a new conversation
  const createConvo = useMutation({
    mutationFn: async (firstMessage: string) => {
      const title = firstMessage.length > 60 ? firstMessage.slice(0, 60) + "…" : firstMessage;
      const { data, error } = await (supabase.from("ai_conversations" as any) as any)
        .insert({ store_id: storeId, user_id: user!.id, title })
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
  });

  const saveUserMessage = useMutation({
    mutationFn: async ({ convoId, content }: { convoId: string; content: string }) => {
      const { data, error } = await (supabase.from("ai_messages" as any) as any)
        .insert({ conversation_id: convoId, store_id: storeId, role: "user", content })
        .select("id, role, content, created_at")
        .single();
      if (error) throw error;
      return data as AiMessage;
    },
  });

  const sendToAi = useCallback(async (text: string) => {
    if (!text.trim() || !storeId || isTyping) return;
    setInput("");
    setIsTyping(true);

    try {
      // Create conversation on first message
      let convoId = activeConvoId;
      if (!convoId) {
        convoId = await createConvo.mutateAsync(text);
        setActiveConvoId(convoId);
        queryClient.invalidateQueries({ queryKey: ["ai-conversations", storeId] });
      }

      // Optimistically add user message
      const optimisticUser: AiMessage = {
        id: `opt-${Date.now()}`,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, optimisticUser]);

      // Persist user message
      const savedUser = await saveUserMessage.mutateAsync({ convoId, content: text });
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === optimisticUser.id ? savedUser : m)),
      );

      // Build messages history for Claude
      const history = [...localMessages, savedUser].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ conversation_id: convoId, store_id: storeId, messages: history }),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? "Erreur de l'assistant IA");
      }

      const assistantMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.content,
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, assistantMsg]);
      queryClient.invalidateQueries({ queryKey: ["ai-messages", convoId] });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message ?? "Impossible de contacter l'assistant",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      textareaRef.current?.focus();
    }
  }, [activeConvoId, storeId, localMessages, isTyping]);

  const deleteConvo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("ai_conversations" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations", storeId] });
      if (activeConvoId === id) {
        setActiveConvoId(null);
        setLocalMessages([]);
      }
    },
  });

  const startNewConvo = () => {
    setActiveConvoId(null);
    setLocalMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToAi(input);
    }
  };

  if (modulesLoading) {
    return (
      <DashboardLayout title="Assistant IA">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </DashboardLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Assistant IA" subtitle="Module IA">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Assistant IA</span> pour obtenir un assistant conversationnel intelligent.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isEmpty = localMessages.length === 0;

  return (
    <DashboardLayout title="Assistant IA" subtitle="Posez vos questions sur votre activité">
      <div className="flex gap-4 h-[calc(100vh-10rem)]">

        {/* Sidebar: conversation list */}
        <div className="w-56 shrink-0 flex flex-col gap-2">
          <Button size="sm" className="w-full gap-2" onClick={startNewConvo}>
            <Plus size={14} /> Nouvelle conversation
          </Button>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-1">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune conversation</p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-start gap-1 rounded-lg px-2 py-2 cursor-pointer hover:bg-muted/60 transition-colors",
                    activeConvoId === c.id && "bg-muted",
                  )}
                  onClick={() => {
                    setActiveConvoId(c.id);
                    setLocalMessages([]);
                  }}
                >
                  <MessageSquare size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs flex-1 line-clamp-2 leading-relaxed">{c.title}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Supprimer cette conversation ?")) deleteConvo.mutate(c.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {isEmpty ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6">
                <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <Bot size={32} className="text-violet-500" />
                </div>
                <h3 className="font-semibold text-base mb-1">Bonjour ! Comment puis-je vous aider ?</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Je suis votre assistant IA. Posez-moi des questions sur vos commandes, votre équipe ou votre activité.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => sendToAi(qp.prompt)}
                      className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted px-3 py-2.5 text-left text-xs font-medium transition-colors"
                    >
                      <qp.icon size={14} className="text-violet-500 shrink-0" />
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {localMessages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"
                className="resize-none min-h-[44px] max-h-[120px] text-sm"
                rows={1}
                disabled={isTyping}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 bg-violet-600 hover:bg-violet-700"
                onClick={() => sendToAi(input)}
                disabled={!input.trim() || isTyping}
              >
                {isTyping
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Send size={16} />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
              <CornerDownLeft size={9} /> Entrée pour envoyer · Maj+Entrée pour un saut de ligne
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
