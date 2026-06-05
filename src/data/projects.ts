export interface Project {
  title: string;
  slug: string;
  category: string;
  image: string;
  video?: string;
  tagline: string;
  description: string;
  tech: string[];
  highlights: string[];
  links: {
    github?: string;
    live?: string;
  };
}

export const projects: Project[] = [
  {
    title: "Compilot",
    slug: "compilot",
    category: "AI Competitor Tracker",
    image: "/images/compilot.png",
    tagline: "Watches your competitors so you don't have to",
    description:
      "Compilot pulls public signals from hiring boards, GitHub, news feeds, patents, and pricing pages, runs them through a multi-agent pipeline, and rolls them up into daily, weekly, and monthly strategy reports. Not just a raw feed — actual analysis.",
    tech: ["Python", "FastAPI", "React", "Vite", "Celery", "Redis", "PostgreSQL", "DeepSeek", "Docker"],
    highlights: [
      "Multi-agent backend on Celery + Redis, pulling from Greenhouse, Lever, HN, RSS, GitHub, and patent data",
      "AI synthesis layer turns scattered signals into structured business intelligence reports",
      "Async FastAPI backend with Kubernetes manifests and an OpenAI-compatible inference layer",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "Chef It",
    slug: "chef-it",
    category: "iOS App",
    image: "/images/chef-it.png",
    tagline: "Scan your fridge, find out what you can cook",
    description:
      "A native iOS app for the classic problem: you have random stuff and no idea what to make. It scans your pantry using computer vision, matches ingredients to real recipes, and walks you through cooking. Social sharing, shopping lists, and full auth — all built during a hackathon.",
    tech: ["Swift", "SwiftUI", "Node.js", "Express", "PostgreSQL", "OpenAI Vision", "Gemini", "Edamam"],
    highlights: [
      "VisionKit + OpenAI Vision + Gemini for ingredient detection and interpretation",
      "Full iOS auth stack: email, Google Sign-In, and Sign in with Apple",
      "Node/Express/Postgres backend with social features, shopping lists, and cooking mode",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "You vs You",
    slug: "you-vs-you",
    category: "Browser Game",
    image: "/images/you-vs-you.png",
    video: "/videos/you-vs-you-demo2.mp4",
    tagline: "A game that studies how you play and adjusts to beat you",
    description:
      "A browser game where the challenge isn't fixed. It tracks your inputs and habits across runs, builds a model of your play style, then reshapes the levels and traps to target your patterns. The more consistent you are, the harder it gets.",
    tech: ["TypeScript", "Vite", "HTML5 Canvas", "Supabase"],
    highlights: [
      "Custom telemetry pipeline feeds a behavioral model that mutates hazard generation each run",
      "Modular adaptive systems: aiTrapDirector, playerAnalyzer, adaptiveGenerator, and run tracker",
      "Supabase-backed auth, coin/shop progression, and cross-device leaderboard",
    ],
    links: {
      github: "",
      live: "https://you-vs-you-game.vercel.app/",
    },
  },
  {
    title: "Vibe Learn",
    slug: "vibe-learn",
    category: "VS Code Extension",
    image:
      "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=1200&auto=format&fit=crop",
    tagline: "Coding help that explains instead of just answering",
    description:
      "A VS Code extension that changes how AI coding help works. Instead of handing you the answer, it asks what you've already tried, explains the concept behind the issue, and adjusts directness based on how stuck you are. OpenAI and local Ollama both supported.",
    tech: ["TypeScript", "VS Code API", "OpenAI", "Ollama", "Node.js"],
    highlights: [
      "Prompt rewriting layer rephrases questions into teaching-oriented queries before they hit the model",
      "Configurable help levels from pure hints to direct code, with VS Code SecretStorage for keys",
      "OpenAI and Ollama fully wired with fuzzy model resolution for local Ollama setups",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "WaterlooWorks+",
    slug: "waterlooworks-plus",
    category: "Chrome Extension",
    image: "/images/waterloo-works-plus.png",
    tagline: "WaterlooWorks with a brain",
    description:
      "A Chrome extension that makes the WaterlooWorks co-op portal worth using. Upload your resume and it parses your skills, re-ranks job listings by actual fit, and surfaces analysis the default UI doesn't bother with. Everything runs in your browser, nothing goes anywhere.",
    tech: ["JavaScript", "Chrome APIs", "Manifest V3"],
    highlights: [
      "Local resume parsing (PDF, DOCX, TXT) matched against posting skills and requirements",
      "Shadow DOM injected panel keeps the extension UI isolated from WaterlooWorks' aging page structure",
      "Privacy-first: chrome.storage.local only, no backend, no data collection",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "Clarus",
    slug: "clarus",
    category: "Academic Copilot",
    image: "/images/clarus.png",
    video: "/videos/clarus-demo.mp4",
    tagline: "The planning layer Brightspace never had",
    description:
      "Clarus connects to D2L/Brightspace through a Playwright-based connector, syncs your courses and deadlines, and wraps it into a dashboard that actually shows you what's going on. Built toward AI-assisted planning, reminders, and workload prioritization — things the school portal never bothered to add.",
    tech: ["Next.js", "TypeScript", "Fastify", "Playwright", "PostgreSQL", "Prisma", "Docker"],
    highlights: [
      "Playwright connector handles D2L auth and syncs courses, content, and timeline data",
      "Three-service architecture: Next.js frontend, Fastify API, and browser automation connector",
      "Foundation for deadline tracking, risk prediction, and AI-guided academic planning",
    ],
    links: {
      github: "",
      live: "https://clarus-eight.vercel.app/",
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
