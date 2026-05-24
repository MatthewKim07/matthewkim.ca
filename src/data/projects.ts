export interface Project {
  title: string;
  slug: string;
  category: string;
  image: string;
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
    category: "Web Development",
    image: "/images/compilot.png",
    tagline: "AI-powered competitive intelligence analyst",
    description:
      "Compilot tracks your competitors across jobs, GitHub, patents, and news, then surfaces strategic reasons behind every signal rather than just raw data. Automated weekly trends and monthly strategy reports so you never miss a move.",
    tech: ["Next.js", "TypeScript", "OpenAI", "Tailwind CSS"],
    highlights: [
      "Automated competitor signal tracking across multiple data sources",
      "AI reasoning layer that surfaces strategy, not just raw data",
      "Weekly trend digests and monthly strategy reports",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "Chef It",
    slug: "chef-it",
    category: "UI/UX Design",
    image: "/images/chef-it.png",
    tagline: "Recipe discovery, reimagined",
    description:
      "Chef It is a recipe discovery app designed around what you actually have in your kitchen. Snap a photo, get personalized recipes, and follow step-by-step guidance without a single trip to the grocery store.",
    tech: ["React Native", "Expo", "TypeScript", "OpenAI Vision"],
    highlights: [
      "Ingredient detection via camera",
      "Personalized recipe matching with dietary filters",
      "Step-by-step cooking mode with voice guidance",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "You vs You",
    slug: "you-vs-you",
    category: "Branding",
    image: "/images/you-vs-you.png",
    tagline: "Personal performance tracking with no ego",
    description:
      "You vs You is a fitness and habit tracker built on the idea that the only meaningful competition is with your past self. Clean design, honest metrics, and no social features.",
    tech: ["React", "TypeScript", "Tailwind CSS", "Supabase"],
    highlights: [
      "Personal best tracking across workouts and habits",
      "Streak system with thoughtful reset mechanics",
      "Offline-first data model",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "Vibe Learn",
    slug: "vibe-learn",
    category: "Mobile App",
    image:
      "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=400&auto=format&fit=crop",
    tagline: "Learn anything through short, curated content",
    description:
      "Vibe Learn surfaces bite-sized learning content tuned to your interests and pace. Think of it as a feed for curious people: no doom-scrolling, just concepts worth knowing.",
    tech: ["React Native", "Expo", "TypeScript", "OpenAI"],
    highlights: [
      "Interest-based content personalization",
      "Spaced repetition for retention",
      "Offline caching for commutes",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "WaterlooWorks+",
    slug: "waterlooworks-plus",
    category: "Data Visualization",
    image: "/images/waterloo-works-plus.png",
    tagline: "Better insights into UWaterloo's co-op job portal",
    description:
      "WaterlooWorks+ adds a data layer on top of UWaterloo's co-op job portal, surfacing application stats, interview conversion rates, and employer trends that the default UI hides.",
    tech: ["TypeScript", "Chrome Extension", "D3.js", "Node.js"],
    highlights: [
      "Real-time application status aggregation",
      "Employer acceptance rate visualization",
      "Job trend heatmaps by discipline and term",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "Clarus",
    slug: "clarus",
    category: "AI Integration",
    image: "/images/clarus.png",
    tagline: "Clarity for complex documents",
    description:
      "Clarus is an AI reading assistant that breaks down dense legal, financial, and academic documents into plain language. Upload any document and get a structured summary, key terms, and Q&A in seconds.",
    tech: ["Next.js", "TypeScript", "Claude API", "Tailwind CSS"],
    highlights: [
      "Multi-format document parsing (PDF, DOCX, TXT)",
      "Structured summary with key terms highlighted",
      "Context-aware Q&A over the document",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "PaintMind",
    slug: "paintmind",
    category: "Systems Design",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop",
    tagline: "Collaborative canvas for visual thinkers",
    description:
      "PaintMind is a real-time collaborative whiteboard built for visual thinkers. Draw, annotate, and brainstorm with your team without the clutter of traditional tools.",
    tech: ["React", "TypeScript", "WebSockets", "Canvas API"],
    highlights: [
      "Real-time multi-user collaboration with CRDTs",
      "Infinite canvas with smart zoom and pan",
      "Export to PNG, SVG, or shareable link",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "Pathfinding API",
    slug: "pathfinding-api",
    category: "Machine Learning",
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop",
    tagline: "Graph traversal as a service",
    description:
      "A REST API exposing multiple pathfinding algorithms, including A*, Dijkstra, BFS, and DFS, with configurable heuristics and weighted graph support. Built for robotics and game dev integration.",
    tech: ["Python", "FastAPI", "NumPy", "Docker"],
    highlights: [
      "Multiple algorithm support with unified interface",
      "Configurable heuristics for A* variants",
      "Weighted and directed graph support",
    ],
    links: {
      github: "",
      live: "",
    },
  },
  {
    title: "QueueMe",
    slug: "queueme",
    category: "Robotics",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop",
    tagline: "Smart queue management for physical spaces",
    description:
      "QueueMe uses computer vision to estimate queue length and wait times in real-world spaces, then surfaces that data through a simple dashboard. Built as a robotics project with ROS2.",
    tech: ["Python", "ROS2", "OpenCV", "FastAPI", "React"],
    highlights: [
      "Real-time queue length estimation via CV",
      "Wait time prediction with rolling average model",
      "Live dashboard with alert thresholds",
    ],
    links: {
      github: "",
      live: "",
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
