"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import { projects } from "@/data/projects";
import { sounds } from "@/lib/sounds";

const GALLERY_SLUGS = [
  "compilot",
  "chef-it",
  "you-vs-you",
  "vibe-learn",
  "waterlooworks-plus",
  "clarus",
];

const galleryProjects = GALLERY_SLUGS
  .map((slug) => projects.find((p) => p.slug === slug)!)
  .filter(Boolean);

const HIGHLIGHT_COLORS: Record<string, string> = {
  "compilot":          "rgba(34, 211, 238, 0.55)",
  "chef-it":           "rgba(253, 186, 116, 0.65)",
  "you-vs-you":        "rgba(250, 204, 21, 0.55)",
  "vibe-learn":        "rgba(217, 70, 239, 0.45)",
  "waterlooworks-plus":"rgba(96, 165, 250, 0.55)",
  "clarus":            "rgba(200, 200, 200, 0.6)",
};

function VideoModal({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const windowRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === windowRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const toggleFullscreen = async () => {
    const videoWindow = windowRef.current;
    if (!videoWindow) return;

    try {
      if (document.fullscreenElement === videoWindow) {
        await document.exitFullscreen();
      } else {
        await videoWindow.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by the browser or iframe policy.
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} demo video`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none md:p-12"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />

      <motion.div
        ref={windowRef}
        className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-[#1b1d24] shadow-[0_30px_90px_rgba(0,0,0,0.6)] ring-1 ring-black/50"
        initial={reduceMotion ? false : { scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.98, opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--font-sf)" }}
      >
        <div className="relative flex h-8 shrink-0 items-center border-b border-black/40 bg-gradient-to-b from-[#30343d] to-[#272a32] px-3">
          <div className="group/lights flex items-center gap-2">
            <button
              ref={closeButtonRef}
              type="button"
              aria-label={`Close ${title} demo video`}
              onClick={onClose}
              className="relative h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/20 transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg
                viewBox="0 0 12 12"
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity group-hover/lights:opacity-100"
              >
                <path d="M3.5 3.5 L8.5 8.5 M8.5 3.5 L3.5 8.5" stroke="#5c0000" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Minimize unavailable"
              disabled
              className="relative h-3 w-3 cursor-default rounded-full bg-[#febc2e] ring-1 ring-black/20"
            >
              <svg
                viewBox="0 0 12 12"
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity group-hover/lights:opacity-100"
              >
                <path d="M3 6 H9" stroke="#6b4a00" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={isFullscreen ? `Exit fullscreen ${title} demo video` : `Enter fullscreen ${title} demo video`}
              onClick={toggleFullscreen}
              className="relative h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/20 transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg
                viewBox="0 0 12 12"
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity group-hover/lights:opacity-100"
                fill="#004d00"
              >
                <path d="M2.6 2.6 L7.9 2.6 L2.6 7.9 Z" />
                <path d="M9.4 9.4 L4.1 9.4 L9.4 4.1 Z" />
              </svg>
            </button>
          </div>
          <span className="pointer-events-none absolute inset-x-10 truncate text-center text-xs font-medium text-white/55">
            {title}.demo
          </span>
        </div>

        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="h-full w-full object-contain"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: (typeof galleryProjects)[number];
  index: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const cardVideoRef = useRef<HTMLVideoElement>(null);
  const primaryLink = project.links.live || project.links.github;
  const highlightColor = HIGHLIGHT_COLORS[project.slug] ?? "rgba(250, 204, 21, 0.55)";

  useEffect(() => {
    if (!modalOpen) {
      cardVideoRef.current?.play().catch(() => {});
    }
  }, [modalOpen]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45, delay: index * 0.07 }}
        data-no-trail
        className="flex flex-col gap-3"
      >
        {/* Media */}
        <div
          className={`relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group ${project.video ? "cursor-pointer" : ""}`}
          onClick={project.video ? () => { sounds[project.slug === "you-vs-you" ? "demoClick" : "demoOpen"](); setModalOpen(true); } : undefined}
        >
          {project.video ? (
            <video
              ref={cardVideoRef}
              src={project.video}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}

          {project.video && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm">
                <Clapperboard size={20} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-4">
            <h3
              className="text-xl text-gray-900 dark:text-white leading-none"
              style={{ fontFamily: "var(--font-milker)" }}
            >
              {primaryLink ? (
                <a
                  href={primaryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-block group/title"
                  onClick={() => sounds.crunch()}
                >
                  <span
                    className="absolute inset-y-0 -inset-x-1 rounded-sm origin-left scale-x-0 group-hover/title:scale-x-100 transition-transform duration-500 ease-out"
                    style={{ backgroundColor: highlightColor }}
                  />
                  <span className="relative">{project.title}</span>
                </a>
              ) : (
                project.title
              )}
            </h3>

            <span
              className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest shrink-0"
              style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}
            >
              {project.category}
            </span>
          </div>

          <p
            className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
            style={{ fontFamily: "var(--font-sf)" }}
          >
            {project.tagline}
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <VideoModal
            key="video-modal"
            src={project.video!}
            title={project.title}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function GenerativeArtGallery() {
  return (
    <div className="w-full bg-white dark:bg-gray-900 px-8 md:px-16 pb-16 select-none">
      <div
        data-basketball-collider
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10"
      >
        {galleryProjects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </div>
    </div>
  );
}
