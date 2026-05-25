"use client";

import {
  animate,
  cubicBezier,
  motion,
  useMotionValue,
} from "motion/react";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  createContext,
} from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

type variants = "default" | "masonry" | "polaroid";

const GridVariantContext = createContext<variants | undefined>(undefined);

const rowVariants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: cubicBezier(0.18, 0.71, 0.11, 1),
    },
  },
};

export const DraggableContainer = ({
  className,
  children,
  variant,
}: {
  className?: string;
  children: React.ReactNode;
  variant?: variants;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  // tileSize = half the container's total dimensions (one tile's extent)
  const tileSize = useRef({ w: 0, h: 0 });
  const isDraggingRef = useRef(false);
  const wheelAnim = useRef<ReturnType<typeof animate> | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Measure once on mount + re-measure if content resizes (images loading)
  useEffect(() => {
    const measure = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      // 4 cols by 2 rows = 8 tiles; wrap at one tile boundary in each axis.
      tileSize.current = { w: rect.width / 4, h: rect.height / 2 };
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  // Wheel scrolls y only
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isDraggingRef.current) return;
      wheelAnim.current?.stop();
      wheelAnim.current = animate(y, y.get() - e.deltaY * 2.7, {
        type: "tween",
        duration: 1.2,
        ease: cubicBezier(0.18, 0.71, 0.11, 1),
      });
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [y]);

  // Wrap the DISPLAY position without touching x/y motion values.
  // Calling x.set() inside x.on("change") cancels Framer Motion's
  // momentum animation every frame, so the display transform wraps instead.
  const wrapTransform = useCallback(
    (transform: { x?: string | number; y?: string | number }) => {
      const xV =
        typeof transform.x === "number"
          ? transform.x
          : parseFloat((transform.x as string) ?? "0");
      const yV =
        typeof transform.y === "number"
          ? transform.y
          : parseFloat((transform.y as string) ?? "0");
      const { w, h } = tileSize.current;
      // ((v % size) - size) % size maps any real v into (-size, 0]
      const wx = w > 0 ? ((xV % w) - w) % w : xV;
      const wy = h > 0 ? ((yV % h) - h) % h : yV;
      return `translateX(${wx}px) translateY(${wy}px)`;
    },
    [],
  );

  return (
    <GridVariantContext.Provider value={variant}>
      <div className="h-dvh overflow-hidden">
        <motion.div className="h-dvh overflow-hidden">
          <motion.div
            className={cn(
              "grid grid-cols-[repeat(4,auto)] h-fit w-fit cursor-grab bg-[#141414] active:cursor-grabbing will-change-transform",
              className,
            )}
            drag
            dragMomentum={true}
            dragTransition={{
              timeConstant: 200,
              power: 0.28,
              restDelta: 0,
              bounceStiffness: 0,
            }}
            onPointerDown={() => { isDraggingRef.current = true; }}
            onPointerUp={() => { isDraggingRef.current = false; }}
            onPointerLeave={() => { isDraggingRef.current = false; }}
            style={{ x, y }}
            transformTemplate={wrapTransform}
            ref={ref}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </GridVariantContext.Provider>
  );
};

export const GridItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const variant = useContext(GridVariantContext);

  const gridItemStyles = cva(
    "overflow-hidden hover:cursor-pointer will-change-transform",
    {
      variants: {
        variant: {
          default: "rounded-sm w-full h-full",
          masonry: "even:mt-[60%] rounded-sm w-full h-full",
          polaroid:
            "border-[10px] border-b-[28px] border-white shadow-xl even:rotate-3 odd:-rotate-2 hover:rotate-0 transition-transform ease-out duration-300 even:mt-[60%] w-[260px] h-[200px]",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    },
  );

  return (
    <motion.div
      className={cn(gridItemStyles({ variant, className }))}
      variants={rowVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

export const GridBody = memo(
  ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => {
    const variant = useContext(GridVariantContext);

    const gridBodyStyles = cva("grid grid-cols-[repeat(6,1fr)] h-fit w-fit", {
      variants: {
        variant: {
          default: "gap-14 p-7 md:gap-28 md:p-14",
          masonry: "gap-x-14 px-7 md:gap-x-28 md:px-14",
          polaroid: "gap-x-14 px-7 md:gap-x-28 md:px-14",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    });

    return (
      <>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(gridBodyStyles({ variant, className }))}
          >
            {children}
          </div>
        ))}
      </>
    );
  },
);

GridBody.displayName = "GridBody";
