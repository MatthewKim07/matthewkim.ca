"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { sounds } from "@/lib/sounds";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    if (theme === "dark") sounds.lightSwitchOn();
    else sounds.lightSwitchOff();
    toggleTheme();
  };

  return (
    <button
      data-no-trail
      onClick={handleClick}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
    >
      {theme === "dark" ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
    </button>
  );
}
