import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, Mail, Rocket, ShoppingCart, Users, Package } from "lucide-react";

const faqItems = [
  { q: "Comment créer ma première commande ?", a: "Allez dans Commandes > Nouvelle commande, remplissez les infos client et ajoutez les articles. La commande apparaîtra dans le pipeline." },
  { q: "Comment ajouter un membre à mon équipe ?", a: "Rendez-vous dans Équipe > Ajouter un membre. Choisissez un rôle (Caller, Préparateur ou Livreur) et entrez les infos du membre." },
  { q: "Comment activer un module payant ?", a: "Allez dans Modules, parcourez les modules disponibles et cliquez sur 'Activer'. Le coût mensuel sera recalculé automatiquement." },
  { q: "Comment fonctionne la facturation ?", a: "La facturation est modulaire : vous payez uniquement les modules activés. Le montant est calculé en temps réel dans la section Facturation." },
  { q: "Comment gérer mon stock ?", a: "Activez le module 'Gestion stock automatique' pour bénéficier des alertes de stock faible et de la mise à jour automatique après chaque commande." },
  { q: "Comment contacter le support ?", a: "Envoyez-nous un email à support@easyflow.app ou contactez-nous via WhatsApp au +225 07 00 00 00." },
];

const Help = () => {
  return (
    <DashboardLayout title="Aide & Support">
      <div className="space-y-8">
        {/* Quick start */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 font-[Space_Grotesk]">
              <Rocket size={20} className="text-primary" />
              Démarrage rapide
            </CardTitle>
            <CardDescription>3 étapes pour être opérationnel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: 1, icon: Package, title: "Ajoutez vos produits", desc: "Créez votre catalogue avec prix, variantes et stock." },
                { step: 2, icon: ShoppingCart, title: "Recevez des commandes", desc: "Créez ou importez vos premières commandes clients." },
                { step: 3, icon: Users, title: "Gérez votre équipe", desc: "Ajoutez callers, préparateurs et livreurs." },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{s.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle size={18} className="text-primary" />
              Questions fréquentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contactez-nous</CardTitle>
            <CardDescription>Notre équipe est là pour vous aider.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={() => window.open("mailto:support@easyflow.app")}>
              <Mail size={16} /> Email
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.open("https://wa.me/22507000000")}>
              <MessageCircle size={16} /> WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Help;
