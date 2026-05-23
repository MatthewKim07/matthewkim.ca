import localFont from "next/font/local";
import GenerativeArtGallery from "@/components/GenerativeArtGallery";
import { CursorTrail } from "@/components/CursorTrail";
import AnimatedTitleWrapper from "@/components/AnimatedTitleWrapper";

const milker = localFont({
  src: "./fonts/milker.otf",
  variable: "--font-milker",
});

export default function Home() {
  return (
    <div className={`${milker.variable} bg-white overflow-x-hidden`}>
      <div
        className="text-center text-6xl md:text-8xl pt-16 pb-4 text-gray-900 cursor-default select-none"
      >
        <AnimatedTitleWrapper
          fontFamily="var(--font-milker)"
          className="text-center text-6xl md:text-8xl text-gray-900 cursor-default select-none"
        />
      </div>
      <GenerativeArtGallery />
      <CursorTrail />
    </div>
  );
}
