"use client";

import dynamic from "next/dynamic";

const AnimatedTitle = dynamic(() => import("@/components/AnimatedTitle"), {
  ssr: false,
  loading: () => (
    <span className="opacity-0">Matthew Kim</span>
  ),
});

export default function AnimatedTitleWrapper({ fontFamily, className }: { fontFamily: string; className?: string }) {
  return <AnimatedTitle fontFamily={fontFamily} className={className} />;
}
