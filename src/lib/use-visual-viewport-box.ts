"use client";

import { useLayoutEffect, useState } from "react";

export type VisualViewportBox = {
  top: number;
  height: number;
};

/**
 * Pins a fixed fullscreen shell to the visual viewport (above the software keyboard).
 * Returns null until mount so SSR and hydration match. Pair with flex footers, not
 * nested `position: fixed` + `transform` (fragile on iOS).
 */
export function useVisualViewportBox(): VisualViewportBox | null {
  const [box, setBox] = useState<VisualViewportBox | null>(null);

  useLayoutEffect(() => {
    const vv = window.visualViewport;
    if (!vv) {
      setBox({ top: 0, height: window.innerHeight });
      return;
    }

    const sync = () => {
      setBox({ top: vv.offsetTop, height: vv.height });
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return box;
}
