import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, UserPlus, Trash2, Mail, Clock } from "lucide-react";
import { useModules } from "@/contexts/ModulesContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  rolesRegistry, computeQuotas,
  type TeamRole,
} from "@/lib/team-roles";
import { useNavigate } from "react-router-dom";
import { NewMemberDialog, type NewMemberFormValues } from "@/components/team/NewMemberDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Map DB roles to frontend roles
const dbToFrontRole: Record<string, TeamRole> = {
  admin: "admin", caller: "caller", preparer: "preparateur", driver: "livreur",
};
const frontToDbRole: Record<string, string> = {
  admin: "admin", caller: "caller", preparateur: "preparer", livreur: "driver",
};

interface MemberRow {
  id: string; // user_roles.id
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: TeamRole;
  avatar_url: string | null;
}

interface InvitationRow {
  id: string;
  email: string;
  role: TeamRole;
  status: string;
  created_at: string;
}

const Team = () => {
  const { activeModules } = useModules();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const quotas = computeQuotas(activeModules);
  const storeId = user?.store_id;

  const [newMemberOpen, setNewMemberOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<MemberRow | null>(null);
  const [deletingInvite, setDeletingInvite] = useState<InvitationRow | null>(null);

  // Fetch team members (profiles + user_roles joined)
  const { data: members = [] } = useQuery({
    queryKey: ["team-members", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, profiles!inner(name, email, phone, avatar_url)")
        .eq("store_id", storeId!);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        name: r.profiles?.name || "Sans nom",
        email: r.profiles?.email || null,
        phone: r.profiles?.phone || null,
        role: dbToFrontRole[r.role] || "caller",
        avatar_url: r.profiles?.avatar_url || null,
      })) as MemberRow[];
    },
  });

  // Fetch pending invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ["team-invitations", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("store_id", storeId!)
        .eq("status", "pending");
      if (error) throw error;
      return (data || []).map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: dbToFrontRole[inv.role] || "caller",
        status: inv.status || "pending",
        created_at: inv.created_at || "",
      })) as InvitationRow[];
    },
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (values: { email: string; role: TeamRole }) => {
      const dbRole = frontToDbRole[values.role] as any;
      const { error } = await supabase.from("team_invitations").insert({
        store_id: storeId!,
        email: values.email,
        role: dbRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      toast({ title: "Invitation envoyée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (member: MemberRow) => {
      // Delete user_role
      const { error: roleErr } = await supabase.from("user_roles").delete().eq("id", member.id);
      if (roleErr) throw roleErr;
      // Delete profile for this store
      const { error: profErr } = await supabase.from("profiles").delete().eq("user_id", member.user_id).eq("store_id", storeId!);
      if (profErr) throw profErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Membre supprimé" });
      setDeletingMember(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // Delete invitation mutation
  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from("team_invitations").delete().eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      toast({ title: "Invitation annulée" });
      setDeletingInvite(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const countByRole = (role: TeamRole) =>
    members.filter((m) => m.role === role).length + invitations.filter((i) => i.role === role).length;

  return (
    <>
      <NewMemberDialog
        open={newMemberOpen}
        onOpenChange={setNewMemberOpen}
        onSubmit={(values: NewMemberFormValues) => inviteMutation.mutate({ email: values.email, role: values.role })}
        existingMembers={members}
        existingInvitations={invitations}
        activeModules={activeModules}
      />

      {/* Delete member dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={(v) => { if (!v) setDeletingMember(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deletingMember?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>Ce membre sera retiré de l'équipe et perdra l'accès à la boutique.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingMember && deleteMemberMutation.mutate(deletingMember)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete invitation dialog */}
      <AlertDialog open={!!deletingInvite} onOpenChange={(v) => { if (!v) setDeletingInvite(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler l'invitation ?</AlertDialogTitle>
            <AlertDialogDescription>L'invitation envoyée à {deletingInvite?.email} sera annulée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingInvite && deleteInviteMutation.mutate(deletingInvite.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DashboardLayout
        title="Équipe"
        actions={<Button size="sm" className="gap-2" onClick={() => setNewMemberOpen(true)}><UserPlus size={16} /> Inviter un membre</Button>}
      >
        {/* Quota cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quotas.map((q) => {
            const role = rolesRegistry[q.role];
            const RoleIcon = role.icon;
            const count = countByRole(q.role);
            const max = q.unlimited ? null : q.base + q.extra;
            const pct = max ? Math.min((count / max) * 100, 100) : 30;
            const atLimit = max !== null && count >= max;
            return (
              <Card key={q.role} className="border-border/60">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <RoleIcon size={16} className={role.color} />
                    <span className="text-sm font-medium">{role.labelPlural}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-[Space_Grotesk]">{count}</span>
                    <span className="text-sm text-muted-foreground">/ {max !== null ? max : "∞"}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  {atLimit && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" onClick={() => navigate("/dashboard/modules")}>
                      <Plus size={12} className="mr-1" /> Augmenter le quota
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-[Space_Grotesk] flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" /> Invitations en attente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Envoyée le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const role = rolesRegistry[inv.role];
                    const RoleIcon = role.icon;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-muted-foreground" />
                            <span className="text-sm">{inv.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5"><RoleIcon size={14} className={role.color} /><span className="text-sm">{role.label}</span></div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingInvite(inv)}>
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Team table */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk]">Membres de l'équipe</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const role = rolesRegistry[member.role];
                  const RoleIcon = role.icon;
                  const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  const isCurrentUser = member.user_id === user?.id;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                          <span className="font-medium text-sm">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5"><RoleIcon size={14} className={role.color} /><span className="text-sm">{role.label}</span></div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{member.email || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{member.phone || "—"}</TableCell>
                      <TableCell>
                        {!isCurrentUser && member.role !== "admin" && (
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingMember(member)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DashboardLayout>
    </>
  );
};

export default Team;
