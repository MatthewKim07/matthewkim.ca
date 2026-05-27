"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";

const BUBBY_PHOTOS = [
  "/images/gallery/Bubby/bubby-gallery1.png",
  "/images/gallery/Bubby/bubby-gallery2.png",
  "/images/gallery/Bubby/bubby-gallery3.png",
  "/images/gallery/Bubby/bubby-gallery4.png",
  "/images/gallery/Bubby/bubby-gallery5.png",
];

export function BubbyGif() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-no-trail
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            {/* Bubble */}
            <div className="flex gap-2 bg-white/10 backdrop-blur-md border border-white/[0.08] rounded-2xl p-2.5">
              {BUBBY_PHOTOS.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
                  className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 relative"
                >
                  <NextImage
                    src={src}
                    alt={`Bubby ${i + 1}`}
                    fill
                    sizes="72px"
                    quality={75}
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
            {/* Tail */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-[9px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: "9px solid transparent",
                borderRight: "9px solid transparent",
                borderTop: "9px solid rgba(255,255,255,0.1)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bubby.gif"
        alt="Bubby"
        className="w-32 h-32 rounded-full object-cover"
      />
    </div>
  );
}
