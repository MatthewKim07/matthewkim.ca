"use client";

import { useEffect, useState } from "react";
import { ImageTrail } from "@/components/ImageTrail";

const albums = [
  "/images/albums/$$$-4-u-album-cover.jpeg",
  "/images/albums/2014-forest-hills-drive-album-cover.jpeg",
  "/images/albums/american-teen-album-cover.jpeg",
  "/images/albums/astroworld-album-cover.jpeg",
  "/images/albums/at-long-last-asap-album-cover.jpeg",
  "/images/albums/beauty-behind-the-madness-album-cover.jpeg",
  "/images/albums/because-the-internet-album-cover.jpeg",
  "/images/albums/birds-in-the-trap-sing-mcknight-album-cover.jpeg",
  "/images/albums/blonde-album-cover.jpeg",
  "/images/albums/born-sinner-album-cover.jpeg",
  "/images/albums/care-package-album-cover.jpeg",
  "/images/albums/channel-orange-album-cover.jpeg",
  "/images/albums/clb-album-cover.jpeg",
  "/images/albums/college-dropout-album-cover.jpeg",
  "/images/albums/ctrl-album-cover.jpeg",
  "/images/albums/currents-album-cover.jpeg",
  "/images/albums/dark-lane-demo-tapes-album-cover.jpeg",
  "/images/albums/flower-boy-album-cover.jpeg",
  "/images/albums/for-all-the-dogs-album-cover.jpeg",
  "/images/albums/freudian-album-cover.jpeg",
  "/images/albums/graduation-album-cover.jpeg",
  "/images/albums/habibti-album-cover.jpeg",
  "/images/albums/her-loss-album-cover.jpeg",
  "/images/albums/hndrxx-album-cover.jpeg",
  "/images/albums/honestly-nevermind-album-cover.jpeg",
  "/images/albums/house-of-balloons-album-cover.jpeg",
  "/images/albums/i-am-i-was-album-cover.jpeg",
  "/images/albums/i-told-you-album-cover.jpeg",
  "/images/albums/iceman-album-cover.jpeg",
  "/images/albums/if-your-reading-this-its-too-late-album-cover.webp",
  "/images/albums/igor-album-cover.jpeg",
  "/images/albums/kids-album-cover.jpeg",
  "/images/albums/late-registration-album-cover.jpeg",
  "/images/albums/lil-uzi-vs-the-world-album-cover.jpeg",
  "/images/albums/lo-fis-album-cover.jpeg",
  "/images/albums/luv-is-rage-2-album-cover.jpeg",
  "/images/albums/maid-of-honour-album-cover.jpeg",
  "/images/albums/more-life-album-cover.jpeg",
  "/images/albums/my-beautiful-dark-twisted-fantasy-album-cover.jpeg",
  "/images/albums/nav-album-cover.jpeg",
  "/images/albums/never-enough-album-cover.jpeg",
  "/images/albums/not-all-heros-wear-capes-album-cover.jpeg",
  "/images/albums/nothing-was-the-same-album-cover.jpeg",
  "/images/albums/partynextdoor-2-album-cover.jpeg",
  "/images/albums/partynextdoor-album-cover.jpeg",
  "/images/albums/sail-out-album-cover.jpeg",
  "/images/albums/scorpion-album-cover.jpeg",
  "/images/albums/so-far-gone-album-cover.jpeg",
  "/images/albums/starboy-album-cover.jpeg",
  "/images/albums/stick-season-album-cover.jpeg",
  "/images/albums/swimming-album-cover.jpeg",
  "/images/albums/take-care-album-cover.jpeg",
  "/images/albums/thank-me-later-album-cover.jpeg",
  "/images/albums/the-blueprint-3-album-cover.jpeg",
  "/images/albums/the-carter-iv-album-cover.jpeg",
  "/images/albums/the-life-of-pablo-album-cover.jpeg",
  "/images/albums/trap-soul-album-cover.jpeg",
  "/images/albums/trip-album-cover.jpeg",
  "/images/albums/ultraviolence-album-cover.jpeg",
  "/images/albums/views-album-cover.jpeg",
  "/images/albums/what-a-time-to-be-alive-album-cover.jpeg",
  "/images/albums/ye-album-cover.jpeg",
  "/images/albums/yeezus-album-cover.jpeg",
];

export function CursorTrail({ active }: { active: boolean }) {
  const [zoneEnabled, setZoneEnabled] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const onNoTrail = !!el?.closest("[data-no-trail]");
      setZoneEnabled(!onNoTrail);
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <ImageTrail interval={120} rotationRange={20} enabled={active && zoneEnabled}>
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
