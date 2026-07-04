"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Info, CheckCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  default: {
    bg: "bg-teal-900/20 border-teal-800/30",
    icon: "text-teal-400",
    dismiss: "text-teal-400 hover:text-teal-300",
    defaultIcon: Lightbulb,
  },
  info: {
    bg: "bg-sky-900/20 border-sky-800/30",
    icon: "text-sky-400",
    dismiss: "text-sky-400 hover:text-sky-300",
    defaultIcon: Info,
  },
  success: {
    bg: "bg-emerald-900/20 border-emerald-800/30",
    icon: "text-emerald-400",
    dismiss: "text-emerald-400 hover:text-emerald-300",
    defaultIcon: CheckCircle,
  },
} as const;

interface ContextualHintProps {
  id: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: keyof typeof VARIANTS;
  dismissible?: boolean;
  className?: string;
}

function storageKey(id: string) {
  return `hint-dismissed-${id}`;
}

export function ContextualHint({
  id,
  children,
  icon,
  variant = "default",
  dismissible = true,
  className,
}: ContextualHintProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey(id)) === "1");
  }, [id]);

  if (dismissed) return null;

  const v = VARIANTS[variant];
  const Icon = icon ?? v.defaultIcon;

  function handleDismiss() {
    localStorage.setItem(storageKey(id), "1");
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3",
            v.bg,
            className
          )}
        >
          <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", v.icon)} />
          <span className="flex-1 text-sm leading-relaxed text-slate-300">
            {children}
          </span>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className={cn("shrink-0 text-xs font-medium", v.dismiss)}
            >
              Got it
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
