"use client";

import { useState, useRef, useEffect } from "react";
import { sounds } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";

const BUBBY_PHOTOS = [
  "/images/gallery/Bubby/bubby-gallery1.png",
  "/images/gallery/Bubby/bubby-gallery2.png",
  "/images/gallery/Bubby/bubby-gallery3.png",
  "/images/gallery/Bubby/bubby-gallery4.png",
  "/images/gallery/Bubby/bubby-gallery5.png",
];

const ANGLES = [-80, -40, 0, 40, 80];
const RADIUS = 150;
const PHOTO_SIZE = 68;
const GIF_SIZE = 128;
const CX = GIF_SIZE / 2;
const CY = GIF_SIZE / 2;

// Arc bounding box in container coords (with 16px buffer)
const BOUNDS = {
  left: CX - RADIUS * Math.sin((80 * Math.PI) / 180) - PHOTO_SIZE / 2 - 16,
  top: CY - RADIUS - PHOTO_SIZE / 2 - 16,
  right: CX + RADIUS * Math.sin((80 * Math.PI) / 180) + PHOTO_SIZE / 2 + 16,
  bottom: GIF_SIZE + 16,
};

export function BubbyGif() {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const barkPlayed = useRef(false);

  useEffect(() => {
    if (!hovered) return;

    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inBounds =
        e.clientX >= rect.left + BOUNDS.left &&
        e.clientX <= rect.left + BOUNDS.right &&
        e.clientY >= rect.top + BOUNDS.top &&
        e.clientY <= rect.top + BOUNDS.bottom;
      if (!inBounds) { barkPlayed.current = false; setHovered(false); }
    };

    document.addEventListener("pointermove", handleMove);
    return () => document.removeEventListener("pointermove", handleMove);
  }, [hovered]);

  return (
    <div
      ref={containerRef}
      className="relative w-32 h-32"
      onMouseEnter={() => {
        if (!barkPlayed.current) {
          barkPlayed.current = true;
          sounds.bubbyBark();
        }
        setHovered(true);
      }}
      data-no-trail
    >
      <AnimatePresence>
        {hovered &&
          BUBBY_PHOTOS.map((src, i) => {
            const rad = (ANGLES[i] * Math.PI) / 180;
            const x = RADIUS * Math.sin(rad);
            const y = -RADIUS * Math.cos(rad);
            const left = CX + x - PHOTO_SIZE / 2;
            const top = CY + y - PHOTO_SIZE / 2;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{
                  duration: 0.22,
                  delay: i * 0.04,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ scale: 1.6, zIndex: 20 }}
                className="absolute rounded-xl overflow-hidden cursor-pointer"
                style={{
                  width: PHOTO_SIZE,
                  height: PHOTO_SIZE,
                  left,
                  top,
                  rotate: `${ANGLES[i] * 0.25}deg`,
                  zIndex: 10,
                }}
              >
                <NextImage
                  src={src}
                  alt={`Bubby ${i + 1}`}
                  fill
                  sizes={`${PHOTO_SIZE}px`}
                  quality={75}
                  className="object-cover"
                />
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bubby.gif"
        alt="Bubby"
        className="relative w-32 h-32 rounded-full object-cover"
        style={{ zIndex: 5 }}
      />
    </div>
  );
}
