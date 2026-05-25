"use client";

import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useState, useRef, useEffect } from "react";

interface TechItem {
  name: string;
  src: string;
}

const LANGUAGES: TechItem[] = [
  { name: "Python",     src: "/images/tech/python-icon.png" },
  { name: "TypeScript", src: "/images/tech/typescript-icon.png" },
  { name: "JavaScript", src: "/images/tech/javascript-icon.webp" },
  { name: "Java",       src: "/images/tech/java-icon.png" },
  { name: "C++",        src: "/images/tech/c-plus-plus-icon.png" },
  { name: "Rust",       src: "/images/tech/rust-icon.png" },
  { name: "Swift",      src: "/images/tech/swift-icon.png" },
  { name: "SQL",        src: "/images/tech/sql-icon.png" },
  { name: "HTML",       src: "/images/tech/html-icon.jpg" },
  { name: "CSS",        src: "/images/tech/css-icon.svg" },
  { name: "Bash",       src: "/images/tech/bash-icon.png" },
  { name: "PHP",        src: "/images/tech/php-icon.png" },
];

const FRAMEWORKS: TechItem[] = [
  { name: "React",         src: "/images/tech/react-icon.png" },
  { name: "Next.js",       src: "/images/tech/nextjs-icon.svg" },
  { name: "Node.js",       src: "/images/tech/nodejs-icon.webp" },
  { name: "Express.js",    src: "/images/tech/expressjs-logo.png" },
  { name: "FastAPI",       src: "/images/tech/fastapi-icon.png" },
  { name: "Flask",         src: "/images/tech/flask-icon.webp" },
  { name: "Tailwind CSS",  src: "/images/tech/tailwind-css.png" },
  { name: "Three.js",      src: "/images/tech/threejs-logo.webp" },
  { name: "Framer Motion", src: "/images/tech/framer-motion-icon.png" },
  { name: "Prisma",        src: "/images/tech/prisma-icon.png" },
  { name: "Expo",          src: "/images/tech/expo-icon.svg" },
  { name: "Hono",          src: "/images/tech/hono-icon.png" },
  { name: "Fastify",       src: "/images/tech/fastify-icon.svg" },
  { name: "NumPy",         src: "/images/tech/numpy-icon.png" },
  { name: "Pandas",        src: "/images/tech/pandas-icon.svg" },
  { name: "Pydantic",      src: "/images/tech/pydantic-icon.png" },
  { name: "Vite",          src: "/images/tech/vite-logo.png" },
];

const TOOLS: TechItem[] = [
  { name: "Docker",          src: "/images/tech/docker-icon.png" },
  { name: "Kubernetes",      src: "/images/tech/kubernetes-icon.png" },
  { name: "GitHub Actions",  src: "/images/tech/github-actions-icon.png" },
  { name: "PostgreSQL",      src: "/images/tech/postgresql-icon.png" },
  { name: "MySQL",           src: "/images/tech/mysql-icon.png" },
  { name: "Supabase",        src: "/images/tech/supabase-icon.svg" },
  { name: "Elasticsearch",   src: "/images/tech/elasticsearch-icon.webp" },
  { name: "Playwright",      src: "/images/tech/playwright-icon.png" },
  { name: "Bun",             src: "/images/tech/bun-icon.png" },
  { name: "Xcode",           src: "/images/tech/xcode-icon.webp" },
  { name: "Nginx",           src: "/images/tech/nginx-icon.png" },
  { name: "Pytest",          src: "/images/tech/pytest-icon.png" },
];

interface TechRowProps {
  label: string;
  items: TechItem[];
  speed?: number;
  direction?: "forward" | "backward";
}

function TechRow({ label, items, speed = 1, direction = "forward" }: TechRowProps) {
  const doubled = [...items, ...items];
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  const [emblaRef] = useEmblaCarousel(
    { loop: true, dragFree: true, align: "start" },
    [AutoScroll({ playOnInit: true, speed, direction, stopOnInteraction: false, stopOnMouseEnter: false })]
  );

  useEffect(() => {
    const tick = () => {
      const pos = mousePosRef.current;
      if (pos && containerRef.current) {
        const el = document.elementFromPoint(pos.x, pos.y);
        const slot = el?.closest("[data-tech-name]") as HTMLElement | null;
        if (slot && containerRef.current.contains(slot)) {
          setTooltip({ name: slot.dataset.techName!, x: pos.x, y: pos.y });
        } else {
          setTooltip(null);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xl text-gray-400 tracking-wide text-center"
        style={{ fontFamily: "var(--font-sf)", fontWeight: 600 }}
      >
        {label}
      </span>
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onMouseMove={(e) => { mousePosRef.current = { x: e.clientX, y: e.clientY }; }}
        onMouseLeave={() => { mousePosRef.current = null; setTooltip(null); }}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex items-center">
            {doubled.map((item, i) => (
              <div
                key={i}
                data-tech-name={item.name}
                className="shrink-0 flex items-center justify-center"
                style={{ width: "72px", paddingLeft: "12px", paddingRight: "12px" }}
              >
                <img
                  src={item.src}
                  alt={item.name}
                  className="h-8 w-auto max-w-[48px] object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none whitespace-nowrap rounded px-2 py-1 text-[11px] text-white bg-gray-800"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28, fontFamily: "var(--font-sf)", fontWeight: 500 }}
        >
          {tooltip.name}
        </div>
      )}
    </div>
  );
}

export function TechStack() {
  return (
    <section className="max-w-3xl mx-auto px-8 py-16 select-none">
      <p
        className="text-2xl text-gray-900 tracking-wide mb-8 text-center font-semibold"
        style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}
      >
        tech i use
      </p>
      <div className="flex flex-col gap-12">
        <TechRow label="languages"              items={LANGUAGES}   speed={0.7} direction="forward"  />
        <TechRow label="libraries & frameworks"  items={FRAMEWORKS}  speed={0.9} direction="backward" />
        <TechRow label="tools"                  items={TOOLS}       speed={0.8} direction="forward"  />
      </div>
    </section>
  );
}
