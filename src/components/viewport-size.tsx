"use client";

import { useEffect, useState } from "react";

export function ViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (process.env.NODE_ENV !== "development" || size.width === 0) return null;

  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] rounded-md border border-border/80 bg-background/95 px-2.5 py-1.5 font-mono text-xs tabular-nums text-foreground shadow-sm backdrop-blur-sm"
      aria-live="polite"
    >
      {size.width} × {size.height}
    </div>
  );
}
