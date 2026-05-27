"use client";

import React from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectOverlay } from "@/components/ProjectOverlay";

const GALLERY_SLUGS = [
  "compilot",
  "chef-it",
  "you-vs-you",
  "vibe-learn",
  "waterlooworks-plus",
  "clarus",
];

const galleryProjects = GALLERY_SLUGS.map(
  (slug) => projects.find((p) => p.slug === slug)!
).filter(Boolean);

const GenerativeArtCanvas = ({ isHovered }: { isHovered: boolean }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animationFrameId: number;

    canvas.width = 400;
    canvas.height = 400;

    const w = canvas.width;
    const h = canvas.height;

    class Line {
      x: number;
      y: number;
      speed: number;
      angle: number;
      length: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.speed = Math.random() * 0.5 + 0.1;
        this.angle = Math.random() * Math.PI * 2;
        this.length = Math.random() * 20 + 5;
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) {
          this.x = Math.random() * w;
          this.y = Math.random() * h;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x - Math.cos(this.angle) * this.length,
          this.y - Math.sin(this.angle) * this.length
        );
        ctx.strokeStyle = `rgba(168, 85, 247, ${Math.random() * 0.3 + 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const lines: Line[] = [];
    for (let i = 0; i < 30; i++) {
      lines.push(new Line());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isHovered) {
        lines.forEach((line) => {
          line.update();
          line.draw();
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    />
  );
};

const GalleryCard = ({
  item,
  index,
  onSelect,
}: {
  item: (typeof galleryProjects)[number];
  index: number;
  onSelect: (slug: string) => void;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        bounce: 0.4,
        duration: 0.8,
        delay: index * 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      data-no-trail
      className="group relative h-80 w-full rounded-xl overflow-hidden select-none"
    >
      <button
        onClick={() => onSelect(item.slug)}
        className="absolute inset-0 z-20 cursor-pointer"
        aria-label={`View ${item.title}`}
      />
      <div
        style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}
        className="absolute inset-0 flex flex-col justify-end p-6 rounded-xl overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src =
              "https://placehold.co/400x400/000000/ffffff?text=Error";
          }}
        />
        <GenerativeArtCanvas isHovered={isHovered} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10">
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-xl text-white mb-1"
            style={{ fontFamily: "var(--font-milker)" }}
          >
            {item.title}
          </motion.h3>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.05,
            }}
            className="text-sm text-slate-400"
            style={{ fontFamily: "var(--font-sf)" }}
          >
            {item.category}
          </motion.p>
        </div>
        <div className="absolute top-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowUpRight />
        </div>
      </div>
    </motion.div>
  );
};

export default function GenerativeArtGallery() {
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);
  const selectedProject = selectedSlug
    ? projects.find((p) => p.slug === selectedSlug) ?? null
    : null;

  return (
    <>
      <div className="relative w-full min-h-screen bg-white flex flex-col items-center justify-center p-8 md:p-16 overflow-hidden">
        <div
          data-basketball-collider
          className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {galleryProjects.map((item, index) => (
            <GalleryCard
              key={item.title}
              item={item}
              index={index}
              onSelect={setSelectedSlug}
            />
          ))}
        </div>
      </div>

      <ProjectOverlay
        project={selectedProject}
        onClose={() => setSelectedSlug(null)}
      />
    </>
  );
}
