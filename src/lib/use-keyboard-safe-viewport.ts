"use client";

import { useLayoutEffect, useState } from "react";

export type KeyboardSafeViewport = {
  /** Pixels to lift `position: fixed; bottom: 0` content so it clears the OSK. */
  bottomInset: number;
  /** Current visual viewport height (visible area above keyboard). */
  visualHeight: number;
};

/**
 * Tracks the visual viewport while a keyboard-hosting surface is open (e.g. bottom sheet with focused input).
 *
 * Requires the page viewport to allow the visual viewport to shrink when the OSK is shown. With
 * `interactive-widget: overlays-content`, neither layout nor visual viewport resize on Chrome Android,
 * so `bottomInset` stays 0 and fixed bottom sheets stay under the keyboard — use `resizes-visual` instead.
 *
 * Includes a short post-open poll because some Android builds report `visualViewport` resize a frame late.
 */
export function useKeyboardSafeViewport(active: boolean): KeyboardSafeViewport | null {
  const [state, setState] = useState<KeyboardSafeViewport | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      setState(null);
      return;
    }

    const read = (): KeyboardSafeViewport => {
      const vv = window.visualViewport;
      const ih = window.innerHeight;
      if (!vv) {
        return { bottomInset: 0, visualHeight: ih };
      }
      return {
        bottomInset: Math.max(0, ih - vv.offsetTop - vv.height),
        visualHeight: vv.height,
      };
    };

    const sync = () => setState(read());

    sync();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    let ticks = 0;
    const poll = window.setInterval(() => {
      sync();
      if (++ticks >= 20) window.clearInterval(poll);
    }, 50);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.clearInterval(poll);
    };
  }, [active]);

  return state;
}
