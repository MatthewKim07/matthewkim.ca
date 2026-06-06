"use client";

import { sounds } from "@/lib/sounds";

type SoundType = keyof typeof sounds;

interface SoundLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  sound: SoundType;
}

export function SoundLink({ sound, onClick, children, ...props }: SoundLinkProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        sounds[sound]();
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
