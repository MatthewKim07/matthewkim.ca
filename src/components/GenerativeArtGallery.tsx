"use client";

import React from "react";
import { motion } from "framer-motion";
import { projects } from "@/data/projects";

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

function ProjectCard({
  project,
  index,
}: {
  project: (typeof galleryProjects)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      data-no-trail
      className="flex flex-col gap-3"
    >
      {/* Media */}
      {project.links.live ? (
        <a
          href={project.links.live}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group block"
          aria-label={`Open ${project.title}`}
        >
          {project.video ? (
            <video
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
        </a>
      ) : (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group">
          {project.video ? (
            <video
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
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3
            className="text-xl text-gray-900 leading-none"
            style={{ fontFamily: "var(--font-milker)" }}
          >
            {project.title}
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
