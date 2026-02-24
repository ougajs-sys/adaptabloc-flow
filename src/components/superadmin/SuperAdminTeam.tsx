import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, UserPlus, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const INTERNAL_ROLES = ["superadmin", "support", "finance", "developer"] as const;
type InternalRole = (typeof INTERNAL_ROLES)[number];

const ROLE_LABELS: Record<InternalRole, string> = {
  superadmin: "Super Admin",
  support: "Support",
  finance: "Finance",
  developer: "Développeur",
};

const ROLE_COLORS: Record<InternalRole, string> = {
  superadmin: "bg-primary/10 text-primary",
  support: "bg-blue-500/10 text-blue-500",
  finance: "bg-emerald-500/10 text-emerald-500",
  developer: "bg-violet-500/10 text-violet-500",
};

interface TeamMember {
  id: string;
  user_id: string;
  role: InternalRole;
  name: string;
  email: string | null;
  created_at: string;
}

// Placeholder store_id for internal team members without a real store
const INTERNAL_STORE_ID = "00000000-0000-0000-0000-000000000000";

export default function SuperAdminTeam() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InternalRole>("support");
  const [inviting, setInviting] = useState(false);

  async function loadMembers() {
    // Get all user_roles with internal admin roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("id, user_id, role, store_id, created_at");

    const internalRoles = (roles || []).filter((r) =>
      INTERNAL_ROLES.includes(r.role as InternalRole)
    );

    if (internalRoles.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(internalRoles.map((r) => r.user_id))];

    // Fetch profiles for these users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, { name: p.name, email: p.email }])
    );

    const teamMembers: TeamMember[] = internalRoles.map((r) => {
      const profile = profileMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        role: r.role as InternalRole,
        name: profile?.name || "Utilisateur",
        email: profile?.email || null,
        created_at: r.created_at,
      };
    });

    // Deduplicate by user_id, keeping highest role
    const deduped = new Map<string, TeamMember>();
    teamMembers.forEach((m) => {
      const existing = deduped.get(m.user_id);
      if (!existing || INTERNAL_ROLES.indexOf(m.role) < INTERNAL_ROLES.indexOf(existing.role)) {
        deduped.set(m.user_id, m);
      }
    });

    setMembers(Array.from(deduped.values()));
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      // Look up user by email in profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", inviteEmail.trim())
        .limit(1);

      if (!profiles || profiles.length === 0) {
        toast({
          title: "Utilisateur introuvable",
          description: "Aucun compte avec cet email. L'utilisateur doit d'abord s'inscrire.",
          variant: "destructive",
        });
        setInviting(false);
        return;
      }

      const targetUserId = profiles[0].user_id;

      // Check if already has this role
      const existing = members.find((m) => m.user_id === targetUserId && m.role === inviteRole);
      if (existing) {
        toast({ title: "Déjà membre", description: "Cet utilisateur a déjà ce rôle.", variant: "destructive" });
        setInviting(false);
        return;
      }

      // Get any store_id for this user (needed for the FK constraint)
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("store_id")
        .eq("user_id", targetUserId)
        .limit(1);

      const storeId = userRoles?.[0]?.store_id;
      if (!storeId) {
        toast({ title: "Erreur", description: "L'utilisateur n'a aucune boutique associée.", variant: "destructive" });
        setInviting(false);
        return;
      }

      const { error } = await supabase.from("user_roles").insert({
        user_id: targetUserId,
        store_id: storeId,
        role: inviteRole as any,
      });

      if (error) throw error;

      toast({ title: "Membre ajouté", description: `${inviteEmail} ajouté comme ${ROLE_LABELS[inviteRole]}` });
      setInviteEmail("");
      await loadMembers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(member: TeamMember) {
    if (member.user_id === user?.id) {
      toast({ title: "Impossible", description: "Vous ne pouvez pas retirer votre propre rôle.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("user_roles").delete().eq("id", member.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Membre retiré" });
    await loadMembers();
  }

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Équipe Intramate</h2>
        <p className="text-sm text-muted-foreground">{members.length} membre(s) interne(s)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ajouter un membre</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
            <Input
              placeholder="Email du membre"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 min-w-[200px]"
              required
            />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as InternalRole)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERNAL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={inviting}>
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nom</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Rôle</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Depuis</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-muted-foreground">{m.email || "—"}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                        {ROLE_LABELS[m.role]}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3 text-right">
                      {m.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemove(m)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Retirer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Aucun membre interne
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
