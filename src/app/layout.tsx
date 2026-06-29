import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { ClientRoot } from "@/components/ClientRoot";
import "./globals.css";

// Expose the SF variable globally so the game overlay (rendered outside the
// page's font wrapper) can use the same font. Additive only — the portfolio's
// body font is unchanged.
const sf = localFont({
  src: [
    { path: "./fonts/sf-regular.otf", weight: "400" },
    { path: "./fonts/sf-medium.otf", weight: "500" },
  ],
  variable: "--font-sf",
});

export const metadata: Metadata = {
  title: "Matthew Kim",
  description: "Portfolio for Matthew Kim",
  icons: { icon: "/bubby.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`min-h-full flex flex-col ${sf.variable}`}>
        <ClientRoot>{children}</ClientRoot>
        <Script id="bfcache-reload" strategy="beforeInteractive">
          {`window.addEventListener("pageshow",function(e){if(e.persisted)location.reload()})`}
        </Script>
      </body>
    </html>
  );
}
