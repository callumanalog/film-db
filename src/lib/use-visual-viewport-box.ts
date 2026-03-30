"use client";

import { useLayoutEffect, useState } from "react";

export type VisualViewportBox = {
  top: number;
  height: number;
};

/**
 * Sizes a fixed overlay to match the visual viewport so content stays above the
 * mobile software keyboard when the page uses interactiveWidget: overlays-content.
 */
export function useVisualViewportBox(): VisualViewportBox {
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
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  return box ?? { top: 0, height: typeof window !== "undefined" ? window.innerHeight : 0 };
}
