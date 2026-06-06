"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled, sounds } from "@/lib/sounds";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

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
      className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
        ${enabled
          ? "bg-gray-900 text-white hover:bg-gray-700"
          : "bg-gray-900 text-gray-500 hover:text-gray-300"
        }`}
      style={{ fontFamily: "var(--font-sf)" }}
    >
      {enabled ? <Volume2 size={11} strokeWidth={2} /> : <VolumeX size={11} strokeWidth={2} />}
      sound effects
    </button>
  );
}
