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
import { useEffect } from "react";

const customerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email().max(150).or(z.literal("")),
  segment: z.enum(["new", "regular", "vip", "inactive"]),
});

export type EditCustomerFormValues = z.infer<typeof customerSchema>;

const segmentLabels: Record<string, string> = {
  new: "Nouveau",
  regular: "Régulier",
  vip: "VIP",
  inactive: "Inactif",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: EditCustomerFormValues) => void;
  defaultValues: EditCustomerFormValues;
}

export function EditCustomerDialog({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, defaultValues, form]);

  const handleSubmit = (values: EditCustomerFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <Pencil size={18} /> Modifier le client
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="segment" render={({ field }) => (
              <FormItem><FormLabel>Segment</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(segmentLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
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
