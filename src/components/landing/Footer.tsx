import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs font-[Space_Grotesk]">EF</span>
            </div>
            <span className="font-bold font-[Space_Grotesk] text-foreground">
              Easy<span className="text-primary">Flow</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 EasyFlow. Gérez sans effort.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Conditions</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
