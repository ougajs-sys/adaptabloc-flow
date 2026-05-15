import { useState } from "react";
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
import { UserPlus, AlertTriangle, ExternalLink, Mail, MessageCircle } from "lucide-react";
import { rolesRegistry, getMaxForRole, type TeamRole } from "@/lib/team-roles";
import { useNavigate } from "react-router-dom";

const memberSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  contact: z.string().min(1, "Ce champ est requis"),
  role: z.enum(["caller", "preparateur", "livreur"] as const),
}).superRefine((data, ctx) => {
  if (data.channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email invalide", path: ["contact"] });
  }
  if (data.channel === "whatsapp" && !/^\+[1-9]\d{7,14}$/.test(data.contact)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Format invalide. Exemple : +221771234567", path: ["contact"] });
  }
});

export type NewMemberFormValues = z.infer<typeof memberSchema>;

interface MemberLike { role: string }
interface InviteLike { role: string }

interface NewMemberDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: NewMemberFormValues) => void;
  existingMembers: MemberLike[];
  existingInvitations: InviteLike[];
  activeModules: string[];
}

export function NewMemberDialog({
  open, onOpenChange, onSubmit,
  existingMembers, existingInvitations, activeModules,
}: NewMemberDialogProps) {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");

  const form = useForm<NewMemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { channel: "email", contact: "", role: "caller" },
  });

  const selectedRole = form.watch("role") as TeamRole;
  const countForRole =
    existingMembers.filter((m) => m.role === selectedRole).length +
    existingInvitations.filter((i) => i.role === selectedRole).length;
  const maxForRole  = getMaxForRole(selectedRole, activeModules);
  const isAtLimit   = maxForRole !== null && countForRole >= maxForRole;

  const switchChannel = (c: "email" | "whatsapp") => {
    setChannel(c);
    form.setValue("channel", c);
    form.setValue("contact", "");
    form.clearErrors("contact");
  };

  const handleSubmit = (values: NewMemberFormValues) => {
    if (isAtLimit) return;
    onSubmit(values);
    form.reset({ channel: "email", contact: "", role: "caller" });
    setChannel("email");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <UserPlus size={18} />
            Inviter un membre
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Channel toggle */}
            <div>
              <p className="text-sm font-medium mb-2">Méthode d'invitation</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchChannel("email")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    channel === "email"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Mail size={14} /> Email
                </button>
                <button
                  type="button"
                  onClick={() => switchChannel("whatsapp")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    channel === "whatsapp"
                      ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                      : "border-border text-muted-foreground hover:border-green-500/50"
                  }`}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              </div>
            </div>

            {/* Role selector */}
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["caller", "preparateur", "livreur"] as TeamRole[]).map((r) => {
                      const def   = rolesRegistry[r];
                      const count = existingMembers.filter((m) => m.role === r).length + existingInvitations.filter((i) => i.role === r).length;
                      const max   = getMaxForRole(r, activeModules);
                      const full  = max !== null && count >= max;
                      return (
                        <SelectItem key={r} value={r}>
                          <span className={full ? "text-muted-foreground" : ""}>
                            {def.label}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({count}/{max !== null ? max : "∞"}){full && " — quota atteint"}
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

            {isAtLimit && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle size={14} />
                <AlertDescription className="text-xs">
                  Quota atteint pour ce rôle ({countForRole}/{maxForRole}).{" "}
                  <button type="button" className="underline font-medium inline-flex items-center gap-1"
                    onClick={() => { onOpenChange(false); navigate("/dashboard/modules"); }}>
                    Augmenter le quota <ExternalLink size={10} />
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Contact field */}
            <FormField control={form.control} name="contact" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {channel === "email" ? "Email du collaborateur" : "Numéro WhatsApp"}
                </FormLabel>
                <FormControl>
                  <Input
                    type={channel === "email" ? "email" : "tel"}
                    placeholder={channel === "email" ? "collaborateur@email.com" : "+221771234567"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {channel === "whatsapp" && (
                  <p className="text-xs text-muted-foreground">Format international requis (ex: +221 pour le Sénégal)</p>
                )}
              </FormItem>
            )} />

            {selectedRole && (
              <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                {rolesRegistry[selectedRole].description}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={isAtLimit} className="gap-2">
                <UserPlus size={14} />
                {channel === "whatsapp" ? "Inviter via WhatsApp" : "Inviter par email"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
