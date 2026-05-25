"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ScribbleNote({
  children,
  note,
}: {
  children: React.ReactNode;
  note: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            aria-hidden
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              right: 0,
              transform: "rotate(-2deg)",
              fontFamily: "var(--font-caveat)",
              fontSize: "14px",
              lineHeight: 1,
              color: "#aaa",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {note}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
