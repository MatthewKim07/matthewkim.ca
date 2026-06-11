"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";

interface EmailLinkProps {
  email: string;
  className?: string;
  children: React.ReactNode;
}

export function EmailLink({ email, className, children }: EmailLinkProps) {
  const [copied, setCopied] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    sounds.bubble();
    const isMac = /Mac/i.test(navigator.userAgent) && !/iPhone|iPad/.test(navigator.userAgent);
    if (isMac) {
      e.preventDefault();
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    }
  }

  return (
    <div className="relative">
      <a
        href={`mailto:${email}`}
        onClick={handleClick}
        className={className}
        aria-label="Email"
      >
        {children}
      </a>
      {copied && (
        <div
          className="absolute top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs whitespace-nowrap pointer-events-none"
          style={{ fontFamily: "var(--font-sf)" }}
        >
          Copied!
        </div>
      )}
    </div>
  );
}
