"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import Image from "next/image";
import { encode } from "qss";
import React from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

type LinkPreviewProps = {
  children: React.ReactNode;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  annotation?: string;
  soundOnClick?: keyof typeof sounds;
} & (
  | { isStatic: true; imageSrc: string; videoSrc?: never }
  | { isStatic: true; videoSrc: string; imageSrc?: never }
  | { isStatic?: false; imageSrc?: never; videoSrc?: never }
);

export const LinkPreview = ({
  children,
  url,
  className,
  width = 200,
  height = 125,
  quality = 50,
  isStatic = false,
  imageSrc = "",
  videoSrc,
  annotation,
  soundOnClick,
}: LinkPreviewProps & { videoSrc?: string; annotation?: string }) => {
  let src: string;
  if (!isStatic) {
    const params = encode({
      url,
      screenshot: true,
      meta: false,
      embed: "screenshot.url",
      colorScheme: "dark",
      "viewport.isMobile": true,
      "viewport.deviceScaleFactor": 1,
      "viewport.width": width * 3,
      "viewport.height": height * 3,
    });
    src = `https://api.microlink.io/?${params}`;
  } else {
    src = imageSrc;
  }

  const [isOpen, setOpen] = React.useState(false);

  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const translateX = useSpring(x, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const targetRect = event.currentTarget.getBoundingClientRect();
    const eventOffsetX = event.clientX - targetRect.left;
    const offsetFromCenter = (eventOffsetX - targetRect.width / 2) / 2;
    x.set(offsetFromCenter);
  };

  return (
    <>
      {!videoSrc ? (
        <div className="hidden">
          <Image
            src={src}
            width={width}
            height={height}
            quality={quality}
            priority
            alt="hidden image"
          />
        </div>
      ) : null}

      <HoverCardPrimitive.Root
        openDelay={50}
        closeDelay={100}
        onOpenChange={(open) => setOpen(open)}
      >
        <HoverCardPrimitive.Trigger
          asChild
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseMove={handleMouseMove}
            onClick={soundOnClick ? () => sounds[soundOnClick]() : undefined}
            className={cn("cursor-pointer", className)}
          >
            {children}
          </a>
        </HoverCardPrimitive.Trigger>

        <HoverCardPrimitive.Content
          className="[transform-origin:var(--radix-hover-card-content-transform-origin)] z-50 data-[state=closed]:pointer-events-none"
          side="top"
          align="center"
          sideOffset={10}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 260, damping: 20 },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                className="shadow-xl rounded-xl relative"
                style={{ x: translateX }}
              >
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-1 bg-white border-2 border-transparent shadow rounded-xl hover:border-neutral-200"
                  style={{ fontSize: 0 }}
                >
                  {videoSrc ? (
                    <video
                      src={videoSrc}
                      width={width}
                      height={height}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="rounded-lg object-cover"
                      style={{ width, height }}
                    />
                  ) : (
                    <Image
                      src={isStatic ? imageSrc : src}
                      width={width}
                      height={height}
                      quality={quality}
                      priority
                      className="rounded-lg"
                      alt="preview image"
                    />
                  )}
                </Link>
                {annotation && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      right: "calc(100% + 10px)",
                      bottom: "28%",
                      transform: "rotate(-4deg)",
                      fontFamily: "var(--font-caveat)",
                      fontSize: "20px",
                      lineHeight: 1,
                      color: "#ef4444",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    {annotation} -&gt;
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Root>
    </>
  );
};
