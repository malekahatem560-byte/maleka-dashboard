import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function LevelHeader({
  level,
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  level: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 px-6 py-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl glass ring-cyber">
          <Icon className="h-5 w-5 text-cyber-cyan" />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {level}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.div>
  );
}
