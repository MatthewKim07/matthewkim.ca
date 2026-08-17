"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_ACTIONS } from "@/components/NavActions";
import { sounds } from "@/lib/sounds";

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Tapping elsewhere or pressing Escape closes the menu, so it never sits
  // open over the page after the user has moved on.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-nav-actions"
            // Width drives the sweep: the row uncovers itself from the right,
            // next to the button that opened it.
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.32,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pr-2">
              {NAV_ACTIONS.map((action, i) => (
                <motion.div
                  key={action.key}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.24,
                    delay: reduceMotion ? 0 : i * 0.04,
                    ease: "easeOut",
                  }}
                >
                  {action}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        data-no-trail
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-actions"
        onClick={() => {
          sounds.mouseClick();
          setOpen((v) => !v);
        }}
        className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 transition-colors"
      >
        {open ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
      </button>
    </div>
  );
}
