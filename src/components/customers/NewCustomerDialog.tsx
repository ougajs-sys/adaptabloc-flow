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
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";

const customerSchema = z.object({
  name: z.string().min(2, "Nom requis").max(100),
  phone: z.string().min(8, "Téléphone requis").max(20),
  email: z.string().email("Email invalide").max(150).or(z.literal("")),
  segment: z.enum(["new", "regular", "vip", "inactive"]),
  address: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export type NewCustomerFormValues = z.infer<typeof customerSchema>;

interface NewCustomerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: NewCustomerFormValues) => void;
}

const segmentLabels: Record<string, string> = {
  new: "Nouveau",
  regular: "Régulier",
  vip: "VIP",
  inactive: "Inactif",
};

export function NewCustomerDialog({ open, onOpenChange, onSubmit }: NewCustomerDialogProps) {
  const form = useForm<NewCustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      segment: "new",
      address: "",
      notes: "",
    },
  });

  const handleSubmit = (values: NewCustomerFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <UserPlus size={18} />
            Nouveau client
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl><Input placeholder="Aminata Diallo" {...field} /></FormControl>
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
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-muted-foreground">(opt.)</span></FormLabel>
                  <FormControl><Input placeholder="client@mail.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="segment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Segment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(segmentLabels).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse <span className="text-muted-foreground">(opt.)</span></FormLabel>
                  <FormControl><Input placeholder="Cocody, Abidjan" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes <span className="text-muted-foreground">(opt.)</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Informations supplémentaires sur le client..."
                    className="resize-none h-20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <UserPlus size={14} />
                Ajouter le client
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
