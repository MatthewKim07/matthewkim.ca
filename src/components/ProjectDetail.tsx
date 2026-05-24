"use client";

import localFont from "next/font/local";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";

const milker = localFont({
  src: "../app/fonts/milker.otf",
  variable: "--font-milker",
});

const sf = localFont({
  src: [
    { path: "../app/fonts/sf-regular.otf", weight: "400" },
    { path: "../app/fonts/sf-medium.otf", weight: "500" },
  ],
  variable: "--font-sf",
});

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

export default function ProjectDetail({ project }: { project: Project }) {
  return (
    <div
      className={`${milker.variable} ${sf.variable} min-h-screen bg-white`}
      style={{ fontFamily: "var(--font-sf)" }}
    >
      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 p-5 z-40"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span style={{ fontWeight: 500 }}>back</span>
        </Link>
      </motion.div>

      <div className="max-w-4xl mx-auto px-8 pt-24 pb-24">
        {/* Header */}
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-xs uppercase tracking-widest text-gray-400 mb-4"
          style={{ fontWeight: 500 }}
        >
          {project.category}
        </motion.p>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-5xl md:text-7xl text-gray-900 mb-4 leading-none select-none"
          style={{ fontFamily: "var(--font-milker)" }}
        >
          {project.title}
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-lg text-gray-500 mb-12"
        >
          {project.tagline}
        </motion.p>

        {/* Hero image */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full rounded-2xl overflow-hidden mb-16 select-none"
          style={{ aspectRatio: "16/9" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Description */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="md:col-span-2"
          >
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4" style={{ fontWeight: 500 }}>
              About
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">{project.description}</p>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Tech */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3" style={{ fontWeight: 500 }}>
                Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Links */}
            {(project.links.github || project.links.live) && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3" style={{ fontWeight: 500 }}>
                  Links
                </h2>
                <div className="space-y-2">
                  {project.links.github && (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowUpRight size={14} strokeWidth={1.5} />
                      GitHub
                    </a>
                  )}
                  {project.links.live && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowUpRight size={14} strokeWidth={1.5} />
                      Live site
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Highlights */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6" style={{ fontWeight: 500 }}>
            Highlights
          </h2>
          <div className="space-y-4">
            {project.highlights.map((h, i) => (
              <motion.div
                key={i}
                custom={7 + i}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="flex items-start gap-4 group"
              >
                <span className="mt-2 w-1 h-1 rounded-full bg-gray-300 shrink-0 group-hover:bg-gray-600 transition-colors" />
                <p className="text-base text-gray-600">{h}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
