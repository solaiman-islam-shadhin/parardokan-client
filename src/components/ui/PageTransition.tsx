import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  pageKey: string;
}

export default function PageTransition({ children, pageKey }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="dashboard-page-transition"
      key={pageKey}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
