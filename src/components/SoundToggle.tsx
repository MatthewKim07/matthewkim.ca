"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled, sounds } from "@/lib/sounds";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) sounds.bubble();
  }

  return (
    <button
      data-no-trail
      onClick={toggle}
      aria-label={enabled ? "Mute sound effects" : "Enable sound effects"}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
    >
      {enabled ? <Volume2 size={15} strokeWidth={1.5} /> : <VolumeX size={15} strokeWidth={1.5} />}
    </button>
  );
}
