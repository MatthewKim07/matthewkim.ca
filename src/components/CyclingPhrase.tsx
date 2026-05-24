"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PHRASES = [
  "i build useful software",
  "i won a hackathon against 200+ developers",
  "i built an AI that tracks competitors for businesses",
  "i shipped a full-stack app in under 24 hours",
  "i built a pantry manager with AI meal suggestions",
  "i wrote a robot navigation algorithm from scratch",
  "i deployed production code used by actual humans",
  "i created generative art that lives on this page",
  "i automated things that used to take people hours",
  "i'm a mechatronics engineer who writes software",
  "i make robots do what humans don't want to",
  "i can read a schematic and a stack trace",
  "i debug hardware and software at the same time",
  "i think in systems, build in iterations",
  "i care more about the code than the title",
  "i've been to 12 countries and counting",
  "i play basketball whenever i'm not at a keyboard",
  "i have strong opinions about music",
  "i listen to 3+ hours of music every day",
  "i prefer building over planning",
  "i fix bugs at 2am and call it productive",
  "i ship features, not excuses",
  "i automate things that shouldn't need humans",
  "i use dark mode for everything",
  "i get excited about things most people find boring",
  "i turn caffeine into shipped products",
  "i take 'build it and they will come' literally",
  "i'm looking for fall 2026 internships, by the way",
  "i was a software developer at UWaterloo",
  "i build real things, not just class projects",
  "i take robotics and AI equally seriously",
  "i have a thing for clean, minimal interfaces",
  "i've rewritten the same function more times than i'll admit",
  "i care about the pixels as much as the logic",
  "i built a 3D food printer (kind of)",
  "i can explain robots and rap lyrics with equal enthusiasm",
  "i study mechatronics, i breathe software",
  "i've pulled enough all-nighters to question my priorities",
  "i would automate my own homework if i could",
  "i love the moment code finally works",
  "i break things so i can fix them better",
  "i've beaten deadlines that had no business being beaten",
  "i want to build things that outlast the repo",
  "i'm the person who reads the documentation",
  "i pick up new stacks faster than i pick up new hobbies",
  "i built an AI agent that does competitive research",
  "i've deployed more things than i've deleted",
  "i think every problem is an engineering problem",
  "i believe good software is invisible",
  "i write code like i'm the one who has to maintain it",
  "i find robotics and music equally therapeutic",
  "i've built tools that replaced entire workflows",
  "i've stayed up for a hackathon and won",
  "i built software that people actually use",
  "i'm from Korea and Canada and somewhere in between",
  "i travel to think and code to create",
  "i believe the best interfaces get out of the way",
  "i've open-sourced things that helped strangers",
  "i once built a working app before the coffee kicked in",
  "i love a good side project that becomes a real project",
  "i get irrationally excited about good type and spacing",
  "i can ship a prototype in an afternoon",
  "i think software should feel like it was made by a person",
  "i've built things that surprised me when they worked",
  "i do mechatronics because it's where hardware gets interesting",
  "i believe every bug has a story",
  "i treat side projects as seriously as anything else",
  "i built an AI-powered competitor analysis tool",
  "i love the intersection of robotics and intelligence",
  "i'm better at debugging when it's quiet",
  "i've shipped code in Python, TypeScript, C++, and ROS",
  "i build things that make other things easier",
  "i play basketball at 6am sometimes",
  "i've won a prize for software i built in 48 hours",
  "i believe constraints make better engineers",
  "i once automated a process no one asked me to",
  "i think the best engineers are also good designers",
  "i read technical docs for fun (sometimes)",
  "i believe a great README is a form of respect",
  "i've deployed to production from a coffee shop",
  "i love when hardware and software finally agree",
  "i've debugged a robot arm at midnight",
  "i believe software is just organized thinking",
];

function getNextRandom(current: number, length: number): number {
  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}

const RESET_MS = 3000;

export function CyclingPhrase() {
  const [idx, setIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const startResetTimer = useCallback(() => {
    clearResetTimer();
    resetTimerRef.current = setTimeout(() => {
      setIdx(0);
      setAnimKey((k) => k + 1);
    }, RESET_MS);
  }, [clearResetTimer]);

  useEffect(() => () => clearResetTimer(), [clearResetTimer]);

  const handleClick = () => {
    setIdx((prev) => getNextRandom(prev, PHRASES.length));
    setAnimKey((k) => k + 1);
  };

  const handleMouseEnter = () => clearResetTimer();
  const handleMouseLeave = () => {
    if (idx !== 0) startResetTimer();
  };

  return (
    <div className="relative h-7">
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="absolute left-0 top-0 group text-left cursor-pointer outline-none"
        aria-label="Click for another phrase"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={animKey}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-block whitespace-nowrap text-lg text-gray-800 group-hover:text-gray-500 transition-colors"
          >
            {PHRASES[idx]}
            <span className="ml-1.5 opacity-0 group-hover:opacity-40 transition-opacity text-sm select-none">
              ↻
            </span>
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
