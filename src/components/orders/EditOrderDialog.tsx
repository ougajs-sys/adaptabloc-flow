import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useEffect } from "react";

const orderItemSchema = z.object({
  name: z.string().min(1, "Requis").max(100),
  qty: z.coerce.number().min(1).max(9999),
  price: z.coerce.number().min(0).max(99_999_999),
  variant: z.string().max(80).optional(),
});

const editOrderSchema = z.object({
  customer: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email().max(150).or(z.literal("")),
  address: z.string().min(5).max(200),
  paymentStatus: z.enum(["pending", "paid", "refunded"]),
  items: z.array(orderItemSchema).min(1),
});

export type EditOrderFormValues = z.infer<typeof editOrderSchema>;

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: EditOrderFormValues) => void;
  defaultValues: EditOrderFormValues;
}

export function EditOrderDialog({ open, onOpenChange, onSubmit, defaultValues }: EditOrderDialogProps) {
  const form = useForm<EditOrderFormValues>({
    resolver: zodResolver(editOrderSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, defaultValues, form]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = form.watch("items");
  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

  const handleSubmit = (values: EditOrderFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <Pencil size={18} /> Modifier la commande
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Informations client</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="customer" render={({ field }) => (
                  <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                  <FormItem><FormLabel>Paiement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="refunded">Remboursé</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="mt-3"><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Articles</p>
                <Button type="button" variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => append({ name: "", qty: 1, price: 0, variant: "" })}>
                  <Plus size={12} /> Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_70px_90px_110px_32px] gap-2 items-start">
                    <FormField control={form.control} name={`items.${index}.name`} render={({ field }) => (
                      <FormItem>{index === 0 && <FormLabel className="text-xs">Article</FormLabel>}<FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.qty`} render={({ field }) => (
                      <FormItem>{index === 0 && <FormLabel className="text-xs">Qté</FormLabel>}<FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                      <FormItem>{index === 0 && <FormLabel className="text-xs">Prix</FormLabel>}<FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.variant`} render={({ field }) => (
                      <FormItem>{index === 0 && <FormLabel className="text-xs">Variante</FormLabel>}<FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className={index === 0 ? "pt-6" : ""}>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-8 text-destructive" disabled={fields.length === 1} onClick={() => remove(index)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <p className="text-lg font-bold font-[Space_Grotesk]">{total.toLocaleString("fr-FR")} F</p>
                </div>
              </div>
            </div>
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
