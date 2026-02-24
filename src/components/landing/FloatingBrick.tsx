import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { type ModuleTier } from "@/lib/modules-registry";

interface FloatingBrickProps {
  icon: LucideIcon;
  name: string;
  tier: ModuleTier;
  index: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const tierColors: Record<ModuleTier, { bg: string; border: string; text: string; glow: string }> = {
  free: {
    bg: "bg-accent/10",
    border: "border-accent/30",
    text: "text-accent",
    glow: "shadow-accent/20",
  },
  tier1: {
    bg: "bg-primary/10",
    border: "border-primary/25",
    text: "text-primary",
    glow: "shadow-primary/15",
  },
  tier2: {
    bg: "bg-primary/15",
    border: "border-primary/35",
    text: "text-primary",
    glow: "shadow-primary/25",
  },
  tier3: {
    bg: "bg-[hsl(280,80%,55%)]/15",
    border: "border-[hsl(280,80%,55%)]/35",
    text: "text-[hsl(280,80%,55%)]",
    glow: "shadow-[hsl(280,80%,55%)]/20",
  },
};

const sizeClasses = {
  sm: "px-3 py-2 text-xs gap-1.5",
  md: "px-4 py-3 text-sm gap-2",
  lg: "px-5 py-4 text-base gap-2.5",
};

export const FloatingBrick = ({ icon: Icon, name, tier, index, size = "md", className = "" }: FloatingBrickProps) => {
  const colors = tierColors[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: -15, rotateY: index % 2 === 0 ? 10 : -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
      transition={{
        delay: 0.3 + index * 0.08,
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 14,
      }}
      whileHover={{
        y: -6,
        scale: 1.05,
        rotateY: 5,
        transition: { duration: 0.2 },
      }}
      className={`
        inline-flex items-center ${sizeClasses[size]}
        rounded-xl border backdrop-blur-sm
        ${colors.bg} ${colors.border}
        shadow-lg ${colors.glow}
        cursor-default select-none
        ${className}
      `}
      style={{ perspective: "800px", transformStyle: "preserve-3d" }}
    >
      <Icon size={size === "sm" ? 14 : size === "md" ? 16 : 20} className={colors.text} />
      <span className={`font-medium ${colors.text}`}>{name}</span>
    </motion.div>
  );
};
