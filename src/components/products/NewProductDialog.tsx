import { useFieldArray, useForm } from "react-hook-form";
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
import { Plus, Trash2, Package } from "lucide-react";

const CATEGORIES = ["Vêtements", "Chaussures", "Accessoires", "Électronique", "Alimentation", "Beauté", "Sport", "Maison", "Autre"];
const EMOJIS = ["📦", "👕", "👟", "👜", "🧢", "⌚", "🏃", "👡", "💄", "📱", "🍕", "🎁"];

const variantSchema = z.object({
  label: z.string().min(1, "Requis").max(60),
  stock: z.coerce.number().min(0).max(999_999),
});

const productSchema = z.object({
  name: z.string().min(2, "Nom requis").max(120),
  category: z.string().min(1, "Catégorie requise"),
  price: z.coerce.number().min(0, "Prix requis").max(99_999_999),
  maxStock: z.coerce.number().min(0).max(999_999),
  image: z.string().min(1, "Emoji requis"),
  status: z.enum(["active", "draft"]),
  variants: z.array(variantSchema).min(1, "Ajoutez au moins une variante"),
});

export type NewProductFormValues = z.infer<typeof productSchema>;

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: NewProductFormValues) => void;
}

export function NewProductDialog({ open, onOpenChange, onSubmit }: NewProductDialogProps) {
  const form = useForm<NewProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      maxStock: 100,
      image: "📦",
      status: "active",
      variants: [{ label: "", stock: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });
  const selectedEmoji = form.watch("image");

  const handleSubmit = (values: NewProductFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
            <Package size={18} />
            Nouveau produit
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Emoji picker */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Icône</p>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => form.setValue("image", e)}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                      selectedEmoji === e
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Info principale */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl><Input placeholder="Sneakers Urban Pro" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix (FCFA)</FormLabel>
                  <FormControl><Input type="number" min="0" placeholder="25000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxStock" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock max</FormLabel>
                  <FormControl><Input type="number" min="0" placeholder="100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Separator />

            {/* Variantes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variantes</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 h-7 text-xs"
                  onClick={() => append({ label: "", stock: 0 })}
                >
                  <Plus size={12} /> Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_80px_32px] gap-2 items-start">
                    <FormField control={form.control} name={`variants.${index}.label`} render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Variante</FormLabel>}
                        <FormControl><Input placeholder="Taille M - Noir" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`variants.${index}.stock`} render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Stock</FormLabel>}
                        <FormControl><Input type="number" min="0" {...field} /></FormControl>
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <Package size={14} />
                Ajouter le produit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
