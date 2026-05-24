import type { Metadata } from "next";
import Script from "next/script";
import { ClientRoot } from "@/components/ClientRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matthew Kim",
  description: "Portfolio for Matthew Kim",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head />
      <body className="min-h-full flex flex-col">
        <ClientRoot>{children}</ClientRoot>
        <Script id="bfcache-reload" strategy="beforeInteractive">
          {`window.addEventListener("pageshow",function(e){if(e.persisted)location.reload()})`}
        </Script>
      </body>
    </html>
  );
}
