"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { lifeQuotes } from "@/data/quotes";

// Deterministic index for the current local calendar day so the quote is the
// same for every visit that day and advances at midnight.
function quoteIndexForToday() {
  const now = new Date();
  const dayNumber = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000
  );
  return ((dayNumber % lifeQuotes.length) + lifeQuotes.length) % lifeQuotes.length;
}

const noopSubscribe = () => () => {};

export function QuoteOfTheDay({
  variant = "default",
}: {
  variant?: "default" | "footer";
}) {
  const reduceMotion = useReducedMotion();
  // Read the day-based pick on the client only. The server snapshot is null so
  // the static HTML stays quote-free, avoiding a hydration mismatch or a stale
  // build-time quote.
  const index = useSyncExternalStore(
    noopSubscribe,
    quoteIndexForToday,
    () => null as number | null
  );

  const entry = index === null ? null : lifeQuotes[index];

  // The footer bar uses inverted colors (dark in light mode, light in dark mode)
  // so the quote needs its own palette to read against it.
  const onFooter = variant === "footer";
  const c = onFooter
    ? {
        mark: "text-white/50 dark:text-gray-900/50",
        quote: "text-white dark:text-gray-900",
        bar: "bg-white/25 group-hover:bg-white/80 dark:bg-gray-900/25 dark:group-hover:bg-gray-900/80",
      }
    : {
        mark: "text-gray-400 dark:text-gray-500",
        quote: "text-gray-800 dark:text-gray-100",
        bar: "bg-gray-300 group-hover:bg-gray-600 dark:bg-gray-600 dark:group-hover:bg-gray-300",
      };

  return (
    <section
      aria-label="Quote of the day"
      className={`flex flex-col items-center text-center select-none ${
        onFooter ? "" : "px-8 pt-24 pb-16"
      }`}
      style={{ fontFamily: "var(--font-sf)" }}
    >
      {/* Reserve space so the layout doesn't jump before the quote resolves. */}
      <div className="min-h-[7rem] flex flex-col items-center justify-center">
        {entry && (
          <motion.figure
            key={index}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="group max-w-2xl cursor-default"
          >
            <blockquote className="flex items-stretch gap-4 md:gap-6">
              <span
                aria-hidden
                className={`w-[2px] shrink-0 self-stretch rounded-full origin-center transition-all duration-300 group-hover:scale-y-110 ${c.bar}`}
              />
              <p
                className={`text-2xl md:text-[2rem] leading-snug ${c.quote}`}
                style={{ fontFamily: "var(--font-caveat)" }}
              >
                <span className={c.mark}>&ldquo;</span>
                {entry.quote}
                <span className={c.mark}>&rdquo;</span>
              </p>
              <span
                aria-hidden
                className={`w-[2px] shrink-0 self-stretch rounded-full origin-center transition-all duration-300 group-hover:scale-y-110 ${c.bar}`}
              />
            </blockquote>
            <figcaption
              className={`mt-3 text-center text-base md:text-lg ${c.mark}`}
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              &mdash; {entry.author}
            </figcaption>
          </motion.figure>
        )}
      </div>
    </section>
  );
}
