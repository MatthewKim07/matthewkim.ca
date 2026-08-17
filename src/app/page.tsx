import Image from "next/image";
import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import { Mail } from "lucide-react";
import { AnimatedIconItem } from "@/components/AnimatedIconItem";
import { QuoteOfTheDay } from "@/components/QuoteOfTheDay";
import GenerativeArtGallery from "@/components/GenerativeArtGallery";
import { TrailControls } from "@/components/TrailControls";
import AnimatedTitleWrapper from "@/components/AnimatedTitleWrapper";
import { LinkPreview } from "@/components/LinkPreview";
import { RainbowText } from "@/components/RainbowText";
import { CyclingPhrase } from "@/components/CyclingPhrase";
import { BasketballWord } from "@/components/BasketballEasterEgg";
import { MusicWord } from "@/components/MusicEasterEgg";
import { TravelWord } from "@/components/travel/TravelWord";
import { TechStack } from "@/components/TechStack";
import { BubbyGif } from "@/components/BubbyGif";
import { SoundLink } from "@/components/SoundLink";
import { EmailLink } from "@/components/EmailLink";
import { NAV_ACTIONS } from "@/components/NavActions";
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { MatthewExeLauncher } from "@/components/MatthewExeLauncher";
import { GAME_ENABLED } from "@/game/config";

const milker = localFont({
  src: "./fonts/milker.otf",
  variable: "--font-milker",
});

const sf = localFont({
  src: [
    { path: "./fonts/sf-regular.otf", weight: "400" },
    { path: "./fonts/sf-medium.otf",  weight: "500" },
  ],
  variable: "--font-sf",
});

const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export default function Home() {
  return (
    <div className={`${milker.variable} ${sf.variable} ${caveat.variable} bg-white dark:bg-gray-900 overflow-x-hidden relative select-none`}>
      {/* The vinyl's disc sits 12px lower than a plain 36px button, because the
          record is inset within its 64x56 artboard. Nudging the menu down by
          that much lines the two circles up by their centres on mobile. */}
      <nav data-no-trail className="absolute top-0 right-0 p-5 mt-3 md:mt-0 flex items-center gap-2 z-40">
        {/* Five circles fit comfortably across a desktop header but crowd the
            title on a phone, so narrow screens collapse them into a menu. */}
        <div className="hidden md:flex items-center gap-2">{NAV_ACTIONS}</div>
        <div className="md:hidden">
          <MobileNavMenu />
        </div>
      </nav>
      <div data-no-trail className="absolute top-0 left-0 p-5 z-40">
        <TrailControls />
      </div>
      {/* The header sits ~76px tall, so the desktop pt-16 leaves the wrapped
          mobile title running into it. Narrow screens get extra clearance. */}
      <div
        className="text-center text-6xl md:text-8xl pt-24 md:pt-16 pb-4 text-site-ink dark:text-site-paper cursor-default select-none"
      >
        <AnimatedTitleWrapper
          fontFamily="var(--font-milker)"
          className="text-center text-6xl md:text-8xl text-site-ink dark:text-site-paper cursor-default select-none"
        />
      </div>
      <div className="relative max-w-xl mx-auto px-8 pt-2 pb-12 text-center select-none">
        <div data-no-trail data-basketball-collider className="text-base text-gray-400 dark:text-gray-500 mb-6 inline-block" style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}>
          <LinkPreview url="https://uwaterloo.ca/future-students/programs/mechatronics-engineering" soundOnClick="mouseClick" className="group">
            <span className="group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Mechatronics Engineering </span><span className="group-hover:text-[#FED34C] transition-colors">@UWaterloo</span>
          </LinkPreview>
        </div>
        <div data-no-trail data-basketball-collider className="text-gray-700 dark:text-gray-300 space-y-3.5 text-left inline-block" style={{ fontFamily: "var(--font-sf)" }}>
          <CyclingPhrase />
          <ul className="text-base text-gray-500 dark:text-gray-400 space-y-2 leading-relaxed">
            <AnimatedIconItem icon="handshake">
              <span>incoming <LinkPreview url="https://www.statcan.gc.ca/en/start" soundOnClick="mouseClick" className="group"><span className="group-hover:text-gray-900 dark:group-hover:text-white transition-colors">open-source developer </span><span className="group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">@StatCan</span></LinkPreview></span>
            </AnimatedIconItem>
            <AnimatedIconItem icon="lightbulb">
              <span>interested in software engineering and robotics</span>
            </AnimatedIconItem>
            <AnimatedIconItem icon="trophy">
              <span>winner of the <LinkPreview isStatic videoSrc="/videos/pantrypal-video.mov" url="https://yourpantrypal.lovable.app/" soundOnClick="pantryPalClick"><RainbowText text="Fide x Lovable Hackathon" /></LinkPreview></span>
            </AnimatedIconItem>
            <AnimatedIconItem icon="star">
              <span><BasketballWord />, <MusicWord />, <TravelWord />, and always building</span>
            </AnimatedIconItem>
            <AnimatedIconItem icon="briefcase">
              <span>seeking spring 2027 internship opportunities</span>
            </AnimatedIconItem>
          </ul>
        </div>
      </div>
      <h2
        className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-8 mt-12"
        style={{ fontFamily: "var(--font-sf)" }}
      >
        <span data-basketball-collider className="inline-block">my experience</span>
      </h2>
      {/* Two narrow columns wrap "University of Waterloo" onto a second line
          while "Western University" stays on one, which pushed that column's
          logo and role a line lower. Stacking on mobile gives each card the
          full width, so there are no rows left to misalign. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-y-0 max-w-lg mx-auto pb-12 px-8">
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center" style={{ fontFamily: "var(--font-sf)" }}><span data-basketball-collider className="inline-block">University of Waterloo</span></h3>
          <h4 className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center -mt-2" style={{ fontFamily: "var(--font-sf)" }}><span data-basketball-collider className="inline-block">Libraries</span></h4>
          <LinkPreview url="https://lib.uwaterloo.ca/web/" soundOnClick="satisfyingPress" width={200} height={130} isStatic imageSrc="/images/uwaterloo-image-link-preview.png">
            <Image data-basketball-collider src="/images/uwaterloo-logo.png" alt="University of Waterloo" width={160} height={160} className="object-contain" />
          </LinkPreview>
          <span data-basketball-collider className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: "var(--font-sf)" }}>Software Developer</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center" style={{ fontFamily: "var(--font-sf)" }}><span data-basketball-collider className="inline-block">Western University</span></h3>
          <h4 className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center -mt-2" style={{ fontFamily: "var(--font-sf)" }}><span data-basketball-collider className="inline-block">FAST</span></h4>
          <LinkPreview url="https://www.appropedia.org/FAST" soundOnClick="satisfyingPress" width={200} height={130} isStatic imageSrc="/images/westernu-image-link-preview.png">
            <Image data-basketball-collider src="/images/westernu-logo.png" alt="Western University" width={160} height={160} className="object-contain" />
          </LinkPreview>
          <span data-basketball-collider className="text-sm text-gray-500 dark:text-gray-400 text-center" style={{ fontFamily: "var(--font-sf)" }}>Engineering Research<br />Assistant</span>
        </div>
      </div>
      <h2
        className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-8 mt-12"
        style={{ fontFamily: "var(--font-sf)" }}
      >
        some of my projects
      </h2>
      <GenerativeArtGallery />
      <TechStack />
      <footer className="relative mt-24" style={{ fontFamily: "var(--font-sf)" }}>
        {/* The copyright and social row are pinned to the footer's left and
            right edges on desktop, which leaves them sitting on top of the
            centred quote once the footer narrows. Below md they join the
            column instead, so everything stacks with even breathing room. */}
        <div className="relative bg-site-ink dark:bg-site-paper px-8 py-14 md:py-10 flex flex-col items-center gap-10 md:gap-8">
          <QuoteOfTheDay variant="footer" />
          <div className="flex flex-col items-center gap-4">
            <BubbyGif />
            {GAME_ENABLED && <MatthewExeLauncher />}
          </div>
          <span className="static order-last md:absolute md:order-none left-8 top-1/2 md:-translate-y-1/2 text-white dark:text-gray-900 text-sm font-medium">© 2026 Matthew Kim</span>
          <div className="static md:absolute right-8 top-1/2 md:-translate-y-1/2 flex items-center gap-3">
            <EmailLink email="matthewminchulkim@gmail.com" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-red-600 dark:bg-gray-900/10 dark:text-gray-900 dark:hover:bg-red-600 dark:hover:text-white transition-colors">
              <Mail size={15} strokeWidth={1.5} />
            </EmailLink>
            <SoundLink sound="linkedinClick" href="https://linkedin.com/in/matthew-min-kim" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-[#0A66C2] dark:bg-gray-900/10 dark:text-gray-900 dark:hover:bg-[#0A66C2] dark:hover:text-white transition-colors">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </SoundLink>
            <SoundLink sound="bubble" href="https://github.com/MatthewKim07" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-[#6e40c9] dark:bg-gray-900/10 dark:text-gray-900 dark:hover:bg-[#6e40c9] dark:hover:text-white transition-colors">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </SoundLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
