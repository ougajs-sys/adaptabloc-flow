import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { modulesRegistry } from "@/lib/modules-registry";
import { FloatingBrick } from "./FloatingBrick";

const floatingBricks = modulesRegistry.filter(m =>
  ["dashboard", "orders_basic", "campaigns", "geo_tracking", "ai_assistant", "loyalty"].includes(m.id)
);

export const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-primary via-[hsl(280,80%,55%)] to-accent p-12 text-center overflow-hidden">
          {/* Radial overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

          {/* Floating bricks in background */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {floatingBricks.map((mod, i) => (
              <motion.div
                key={mod.id}
                animate={{
                  y: [0, -15, 0],
                  x: [0, i % 2 === 0 ? 8 : -8, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4 + i * 0.5,
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{
                  top: `${15 + (i * 25) % 70}%`,
                  left: `${5 + (i * 18) % 85}%`,
                }}
              >
                <div className="px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/10 text-white text-xs font-medium flex items-center gap-1.5">
                  <mod.icon size={12} />
                  {mod.name}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground font-[Space_Grotesk] mb-4">
              Prêt à simplifier votre gestion ?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Rejoignez les entrepreneurs qui gèrent sans effort. 14 jours gratuits, sans engagement.
            </p>
            <Button
              size="lg"
              asChild
              className="text-base px-8 h-12 text-white border-0 shadow-xl shadow-black/20"
              style={{ backgroundColor: "#1877F2" }}
            >
              <Link to="/login" className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Commencer avec Facebook
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
