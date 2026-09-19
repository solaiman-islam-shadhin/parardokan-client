import { Store } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function BrandedLoader({
  fullScreen = false,
  size = "md",
  label = "Loading...",
}: Props) {
  const reducedMotion = useReducedMotion();
  const dimensions = {
    sm: { wrapper: "h-8 w-8", icon: 15, ring: "rounded-xl" },
    md: { wrapper: "h-12 w-12", icon: 21, ring: "rounded-2xl" },
    lg: { wrapper: "h-16 w-16", icon: 28, ring: "rounded-[1.35rem]" },
  }[size];

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div className={`relative flex ${dimensions.wrapper} items-center justify-center`}>
        <motion.span
          className={`absolute inset-0 border border-primary/30 ${dimensions.ring}`}
          animate={reducedMotion ? undefined : { scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className={`absolute inset-1 border-2 border-dashed border-primary/45 ${dimensions.ring}`}
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className={`relative flex ${dimensions.wrapper} items-center justify-center bg-primary text-primary-content shadow-md shadow-primary/25 ${dimensions.ring}`}
          animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Store size={dimensions.icon} strokeWidth={2.2} />
        </motion.div>
      </div>
      {size !== "sm" && (
        <motion.span
          className="text-sm font-medium text-base-content/60"
          animate={reducedMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );

  if (!fullScreen) return loader;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-base-200">
      {loader}
    </div>
  );
}
