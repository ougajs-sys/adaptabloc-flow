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
import { Pencil } from "lucide-react";
import { rolesRegistry, type TeamRole } from "@/lib/team-roles";
import { useEffect } from "react";

const memberSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  role: z.enum(["caller", "preparateur", "livreur"] as const),
  status: z.enum(["active", "inactive"] as const),
});

export type EditMemberFormValues = z.infer<typeof memberSchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: EditMemberFormValues) => void;
  defaultValues: EditMemberFormValues;
}

export function EditMemberDialog({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<EditMemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, defaultValues, form]);

  const handleSubmit = (values: EditMemberFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <Pencil size={18} /> Modifier le membre
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Rôle</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {(["caller", "preparateur", "livreur"] as TeamRole[]).map((r) => (
                      <SelectItem key={r} value={r}>{rolesRegistry[r].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              <FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" className="gap-2"><Pencil size={14} /> Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
