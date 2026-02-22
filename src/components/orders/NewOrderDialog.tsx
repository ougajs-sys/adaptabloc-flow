import { useState, useEffect } from "react";
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
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StoreProduct {
  id: string;
  name: string;
  price: number;
}

const orderItemSchema = z.object({
  name: z.string().min(1, "Requis").max(100),
  qty: z.coerce.number().min(1, "Min 1").max(9999),
  price: z.coerce.number().min(0, "Min 0").max(99_999_999),
  variant: z.string().max(80).optional(),
});

const orderSchema = z.object({
  customer: z.string().min(2, "Nom requis").max(100),
  phone: z.string().min(8, "Téléphone requis").max(20),
  email: z.string().email("Email invalide").max(150).or(z.literal("")),
  address: z.string().min(5, "Adresse requise").max(200),
  paymentStatus: z.enum(["pending", "paid"]),
  items: z.array(orderItemSchema).min(1, "Ajoutez au moins un article"),
});

export type NewOrderFormValues = z.infer<typeof orderSchema>;

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: NewOrderFormValues) => void;
}

export function NewOrderDialog({ open, onOpenChange, onSubmit }: NewOrderDialogProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    if (!open || !user?.store_id) return;
    supabase
      .from("products")
      .select("id, name, price")
      .eq("store_id", user.store_id)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProducts(data || []));
  }, [open, user?.store_id]);

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer: "",
      phone: "",
      email: "",
      address: "",
      paymentStatus: "pending",
      items: [{ name: "", qty: 1, price: 0, variant: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const items = form.watch("items");
  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

  const handleSubmit = (values: NewOrderFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <ShoppingCart size={18} />
            Nouvelle commande
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Client info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Informations client</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="customer" render={({ field }) => (
                  <FormItem>
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
                    <FormLabel>Email <span className="text-muted-foreground">(optionnel)</span></FormLabel>
                    <FormControl><Input placeholder="client@mail.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paiement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="mt-3">
                  <FormLabel>Adresse de livraison</FormLabel>
                  <FormControl><Input placeholder="Cocody, Rue des Jardins, Abidjan" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Separator />

            {/* Articles */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Articles</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 h-7 text-xs"
                  onClick={() => append({ name: "", qty: 1, price: 0, variant: "" })}
                >
                  <Plus size={12} /> Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_70px_90px_110px_32px] gap-2 items-start">
                    <FormField control={form.control} name={`items.${index}.name`} render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Article</FormLabel>}
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            const product = products.find((p) => p.name === val);
                            if (product) {
                              form.setValue(`items.${index}.price`, product.price);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un produit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.name}>
                                {p.name} — {p.price.toLocaleString("fr-FR")} F
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.qty`} render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Qté</FormLabel>}
                        <FormControl><Input type="number" min="1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Prix unit.</FormLabel>}
                        <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.variant`} render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Variante</FormLabel>}
                        <FormControl><Input placeholder="Taille M" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className={index === 0 ? "pt-6" : ""}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-8 text-destructive hover:text-destructive"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Total estimé</span>
                  <p className="text-lg font-bold font-[Space_Grotesk]">
                    {total.toLocaleString("fr-FR")} F
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <ShoppingCart size={14} />
                Créer la commande
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
