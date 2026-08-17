import { Mail } from "lucide-react";
import { SoundLink } from "@/components/SoundLink";
import { EmailLink } from "@/components/EmailLink";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

const BUTTON =
  "flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 transition-colors";

// The header actions, defined once and rendered by both the desktop row and
// the mobile hamburger menu so the two can never drift apart.
export const NAV_ACTIONS = [
  <EmailLink
    key="email"
    email="matthewminchulkim@gmail.com"
    className={`${BUTTON} hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white`}
  >
    <Mail size={15} strokeWidth={1.5} />
  </EmailLink>,

  <SoundLink
    key="linkedin"
    sound="linkedinClick"
    href="https://linkedin.com/in/matthew-min-kim"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="LinkedIn"
    className={`${BUTTON} hover:bg-[#0A66C2] dark:hover:bg-[#0A66C2] dark:hover:text-white`}
  >
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  </SoundLink>,

  <SoundLink
    key="github"
    sound="bubble"
    href="https://github.com/MatthewKim07"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="GitHub"
    className={`${BUTTON} hover:bg-[#6e40c9] dark:hover:bg-[#6e40c9] dark:hover:text-white`}
  >
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  </SoundLink>,

  <SoundToggle key="sound" />,
  <ThemeToggle key="theme" />,
];
