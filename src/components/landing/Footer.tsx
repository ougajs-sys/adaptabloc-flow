import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs font-[Space_Grotesk]">IM</span>
              </div>
              <span className="font-bold font-[Space_Grotesk] text-foreground">
                Intra<span className="text-primary">mate</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le logiciel modulaire qui s'adapte à votre commerce africain.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent font-medium">
              🌍 Fait pour l'Afrique
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Produit</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Modules</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</a></li>
              <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Légal</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Confidentialité</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Conditions d'utilisation</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Contact</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">contact@intramate.app</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Intramate. Gérez sans effort.
          </p>
        </div>
      </div>
    </footer>
  );
};
