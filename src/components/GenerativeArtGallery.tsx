"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clapperboard } from "lucide-react";
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
  "compilot":          "rgba(250, 204, 21, 0.55)",
  "chef-it":           "rgba(253, 186, 116, 0.65)",
  "you-vs-you":        "rgba(250, 204, 21, 0.55)",
  "vibe-learn":        "rgba(250, 204, 21, 0.55)",
  "waterlooworks-plus":"rgba(96, 165, 250, 0.55)",
  "clarus":            "rgba(200, 200, 200, 0.6)",
};

function VideoModal({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-8 md:p-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden z-10 shadow-2xl"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full h-full object-cover"
        />
      </motion.div>

      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close video"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
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
          className={`relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group ${project.video ? "cursor-pointer" : ""}`}
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
              className="text-xl text-gray-900 leading-none"
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
              className="text-xs text-gray-400 uppercase tracking-widest shrink-0"
              style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}
            >
              {project.category}
            </span>
          </div>

          <p
            className="text-sm text-gray-500 leading-relaxed"
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
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function GenerativeArtGallery() {
  return (
    <div className="w-full bg-white px-8 md:px-16 pb-16">
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
