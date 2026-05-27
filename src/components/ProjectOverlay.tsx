"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";

const TECH_ICONS: Record<string, string> = {
  "Python":        "/images/tech/python-icon.png",
  "FastAPI":       "/images/tech/fastapi-icon.png",
  "React":         "/images/tech/react-icon.png",
  "Vite":          "/images/tech/vite-logo.png",
  "PostgreSQL":    "/images/tech/postgresql-icon.png",
  "DeepSeek":      "/images/tech/deepseek-icon.png",
  "Docker":        "/images/tech/docker-icon.png",
  "Kubernetes":    "/images/tech/kubernetes-icon.png",
  "Swift":         "/images/tech/swift-icon.png",
  "Node.js":       "/images/tech/nodejs-icon.webp",
  "Express":       "/images/tech/expressjs-logo.png",
  "TypeScript":    "/images/tech/typescript-icon.png",
  "JavaScript":    "/images/tech/javascript-icon.webp",
  "Supabase":      "/images/tech/supabase-icon.svg",
  "Next.js":       "/images/tech/nextjs-icon.svg",
  "Fastify":       "/images/tech/fastify-icon.svg",
  "Playwright":    "/images/tech/playwright-icon.png",
  "Prisma":        "/images/tech/prisma-icon.png",
  "Tailwind CSS":  "/images/tech/tailwind-css.png",
  "Expo":          "/images/tech/expo-icon.svg",
  "Framer Motion": "/images/tech/framer-motion-icon.png",
  "Bun":           "/images/tech/bun-icon.png",
  "Rust":          "/images/tech/rust-icon.png",
  "Redis":         "/images/tech/Redis.svg",
  "OpenAI":        "/images/tech/openai-icon.svg",
  "OpenAI Vision": "/images/tech/openai-icon.svg",
  "Gemini":        "/images/tech/gemini-icon.webp",
  "Edamam":        "/images/tech/edamam-icon.png",
  "Chrome APIs":   "/images/tech/Chrome.svg",
  "Manifest V3":   "/images/tech/Chrome.svg",
  "VS Code API":   "/images/tech/Visual Studio Code (VS Code).svg",
  "Ollama":        "/images/tech/ollama-icon.png",
};

export function ProjectOverlay({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  useEffect(() => {
    document.body.style.overflow = project ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop — handles click-outside close */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[6px]"
            onClick={onClose}
          />

          {/* Scroll container */}
          <div
            key="scroll"
            className="fixed inset-0 z-50 overflow-y-auto pointer-events-none flex justify-center px-4 py-8"
            data-no-trail
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-3xl h-fit bg-white rounded-2xl shadow-2xl overflow-hidden self-start"
            >
              {/* Media — object-contain so portrait screenshots show fully */}
              <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center">
                {project.video ? (
                  <video
                    ref={videoRef}
                    key={project.video}
                    src={project.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm hover:bg-black/65 transition-colors"
                  aria-label="Close project"
                >
                  <X size={15} strokeWidth={1.5} />
                </button>
              </div>

              {/* Content — flows naturally, no inner scroll */}
              <div
                className="p-6 md:p-8 space-y-6"
                style={{ fontFamily: "var(--font-sf)" }}
              >
                {/* Header */}
                <div>
                  <p
                    className="text-xs uppercase tracking-widest text-gray-400 mb-2"
                    style={{ fontWeight: 500 }}
                  >
                    {project.category}
                  </p>
                  <h2
                    className="text-4xl text-gray-900 leading-none mb-2"
                    style={{ fontFamily: "var(--font-milker)" }}
                  >
                    {project.title}
                  </h2>
                  <p className="text-base text-gray-500">{project.tagline}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 leading-relaxed">
                  {project.description}
                </p>

                {/* Stack + Links row */}
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p
                      className="text-xs uppercase tracking-widest text-gray-400 mb-2"
                      style={{ fontWeight: 500 }}
                    >
                      Stack
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech.map((t) => {
                        const icon = TECH_ICONS[t];
                        return (
                          <span
                            key={t}
                            className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-full px-2.5 py-1"
                          >
                            {icon && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={icon} alt="" aria-hidden="true" className="w-3.5 h-3.5 object-contain" />
                            )}
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {(project.links.github || project.links.live) && (
                    <div>
                      <p
                        className="text-xs uppercase tracking-widest text-gray-400 mb-2"
                        style={{ fontWeight: 500 }}
                      >
                        Links
                      </p>
                      <div className="flex gap-4">
                        {project.links.github && (
                          <a
                            href={project.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            <ArrowUpRight size={13} strokeWidth={1.5} />
                            GitHub
                          </a>
                        )}
                        {project.links.live && (
                          <a
                            href={project.links.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            <ArrowUpRight size={13} strokeWidth={1.5} />
                            Live
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Highlights */}
                {project.highlights.length > 0 && (
                  <div>
                    <p
                      className="text-xs uppercase tracking-widest text-gray-400 mb-3"
                      style={{ fontWeight: 500 }}
                    >
                      Highlights
                    </p>
                    <div className="space-y-2">
                      {project.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="mt-2 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                          <p className="text-sm text-gray-600">{h}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
