"use client";

import { useEffect, useRef, useState } from "react";

interface Vector {
  x: number;
  y: number;
}

interface MouseVector {
  position: Vector;
  vector: Vector;
}

export function useMouseVector(
  containerRef?: React.RefObject<HTMLElement>
): MouseVector {
  const [position, setPosition] = useState<Vector>({ x: 0, y: 0 });
  const [vector, setVector] = useState<Vector>({ x: 0, y: 0 });
  const lastPositionRef = useRef<Vector>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef?.current;
      let x: number;
      let y: number;

      if (container) {
        const rect = container.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      } else {
        x = e.clientX;
        y = e.clientY;
      }

      const newVector = {
        x: x - lastPositionRef.current.x,
        y: y - lastPositionRef.current.y,
      };

      lastPositionRef.current = { x, y };
      setPosition({ x, y });
      setVector(newVector);
    };

    const target = containerRef?.current ?? window;
    target.addEventListener("mousemove", handleMouseMove as EventListener);
    return () =>
      target.removeEventListener("mousemove", handleMouseMove as EventListener);
  }, [containerRef]);

  return { position, vector };
}
