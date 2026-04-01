"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAppRuntime } from "@/lib/app-runtime";

export function AppRuntimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const runtime = getAppRuntime();
    const root = document.documentElement;

    root.dataset.appPlatform = runtime.platform;
    root.dataset.appShell = runtime.isCapacitor ? "capacitor" : "web";
    root.classList.toggle("app-shell-capacitor", runtime.isCapacitor);
    root.classList.toggle("app-platform-ios", runtime.platform === "ios");
    root.classList.toggle("app-platform-android", runtime.platform === "android");

    let removeNativeListeners: (() => void) | undefined;

    if (runtime.isCapacitor) {
      void (async () => {
        const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/splash-screen"),
          import("@capacitor/status-bar"),
        ]);

        await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
        await SplashScreen.hide().catch(() => undefined);

        const appUrlListener = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const nextUrl = new URL(url);
            const target = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
            if (target.startsWith("/")) {
              router.push(target);
            }
          } catch {
            // Ignore malformed deep links.
          }
        });

        removeNativeListeners = () => {
          void appUrlListener.remove();
        };
      })();
    }

    return () => {
      removeNativeListeners?.();
      delete root.dataset.appPlatform;
      delete root.dataset.appShell;
      root.classList.remove("app-shell-capacitor", "app-platform-ios", "app-platform-android");
    };
  }, [router]);

  return null;
}
