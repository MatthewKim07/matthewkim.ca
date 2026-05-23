"use client";

import { useEffect, useState } from "react";
import { ImageTrail } from "@/components/ImageTrail";

const albums = [
  "/images/take-care-album-cover.jpeg",
  "/images/nothing-was-the-same-album-cover.jpeg",
  "/images/if-your-reading-this-its-too-late-album-cover.webp",
  "/images/what-a-time-to-be-alive-album-cover.jpeg",
  "/images/views-album-cover.jpeg",
  "/images/more-life-album-cover.jpeg",
  "/images/scorpion-album-cover.jpeg",
  "/images/care-package-album-cover.jpeg",
  "/images/dark-lane-demo-tapes-album-cover.jpeg",
  "/images/clb-album-cover.jpeg",
  "/images/honestly-nevermind-album-cover.jpeg",
  "/images/her-loss-album-cover.jpeg",
  "/images/for-all-the-dogs-album-cover.jpeg",
  "/images/$$$-4-u-album-cover.jpeg",
  "/images/iceman-album-cover.jpeg",
  "/images/habibti-album-cover.jpeg",
  "/images/maid-of-honour-album-cover.jpeg",
];

export function CursorTrail() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const onNoTrail = !!el?.closest("[data-no-trail]");
      setEnabled(!onNoTrail);
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <ImageTrail interval={120} rotationRange={20} enabled={enabled}>
        {albums.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            className="w-14 h-14 rounded-md object-cover shadow-md"
          />
        ))}
      </ImageTrail>
    </div>
  );
}
