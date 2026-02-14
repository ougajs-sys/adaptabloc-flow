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
import { Plus, UserPlus } from "lucide-react";
import { useModules } from "@/contexts/ModulesContext";
import {
  rolesRegistry,
  mockTeamMembers,
  computeQuotas,
  type TeamRole,
  type TeamMember,
} from "@/lib/team-roles";
import { useNavigate } from "react-router-dom";

const Team = () => {
  const { activeModules } = useModules();
  const navigate = useNavigate();
  const quotas = computeQuotas(activeModules);
  const [members] = useState<TeamMember[]>(mockTeamMembers);

  const countByRole = (role: TeamRole) => members.filter((m) => m.role === role).length;

  return (
    <DashboardLayout
      title="Équipe"
      actions={
        <Button size="sm" className="gap-2">
          <UserPlus size={16} /> Ajouter un membre
        </Button>
      }
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
                  <span className="text-sm text-muted-foreground">
                    / {max !== null ? max : "∞"}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                {atLimit && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => navigate("/dashboard/modules")}
                  >
                    <Plus size={12} className="mr-1" /> Augmenter le quota
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                <TableHead>Téléphone</TableHead>
                <TableHead>Commandes traitées</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const role = rolesRegistry[member.role];
                const RoleIcon = role.icon;
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <RoleIcon size={14} className={role.color} />
                        <span className="text-sm">{role.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.phone}</TableCell>
                    <TableCell className="font-medium text-sm font-[Space_Grotesk]">
                      {member.ordersHandled}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                        {member.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Team;
