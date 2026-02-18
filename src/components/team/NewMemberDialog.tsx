import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, AlertTriangle, ExternalLink } from "lucide-react";
import { rolesRegistry, getMaxForRole, type TeamRole, type TeamMember } from "@/lib/team-roles";
import { useNavigate } from "react-router-dom";

const memberSchema = z.object({
  name: z.string().min(2, "Nom requis").max(100),
  phone: z.string().min(8, "Téléphone requis").max(20),
  role: z.enum(["caller", "preparateur", "livreur"] as const),
});

export type NewMemberFormValues = z.infer<typeof memberSchema>;

interface NewMemberDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: NewMemberFormValues) => void;
  existingMembers: TeamMember[];
  activeModules: string[];
}

export function NewMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  existingMembers,
  activeModules,
}: NewMemberDialogProps) {
  const navigate = useNavigate();
  const form = useForm<NewMemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", phone: "", role: "caller" },
  });

  const selectedRole = form.watch("role") as TeamRole;
  const countForRole = existingMembers.filter((m) => m.role === selectedRole).length;
  const maxForRole = getMaxForRole(selectedRole, activeModules);
  const isAtLimit = maxForRole !== null && countForRole >= maxForRole;

  const handleSubmit = (values: NewMemberFormValues) => {
    if (isAtLimit) return;
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <UserPlus size={18} />
            Ajouter un membre
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["caller", "preparateur", "livreur"] as TeamRole[]).map((r) => {
                      const def = rolesRegistry[r];
                      const count = existingMembers.filter((m) => m.role === r).length;
                      const max = getMaxForRole(r, activeModules);
                      const full = max !== null && count >= max;
                      return (
                        <SelectItem key={r} value={r}>
                          <span className={full ? "text-muted-foreground" : ""}>
                            {def.label}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({count}/{max !== null ? max : "∞"})
                              {full && " — quota atteint"}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Quota warning */}
            {isAtLimit && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle size={14} />
                <AlertDescription className="text-xs">
                  Quota atteint pour ce rôle ({countForRole}/{maxForRole}).{" "}
                  <button
                    type="button"
                    className="underline font-medium inline-flex items-center gap-1"
                    onClick={() => {
                      onOpenChange(false);
                      navigate("/dashboard/modules");
                    }}
                  >
                    Augmenter le quota <ExternalLink size={10} />
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl><Input placeholder="Koné Mamadou" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl><Input placeholder="+225 07 12 34 56" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Role description */}
            {selectedRole && (
              <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                {rolesRegistry[selectedRole].description}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isAtLimit} className="gap-2">
                <UserPlus size={14} />
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
