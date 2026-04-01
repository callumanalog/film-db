"use client";

export type AppPlatform = "web" | "ios" | "android";

export type AppRuntime = {
  isCapacitor: boolean;
  platform: AppPlatform;
};

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

export function getAppRuntime(): AppRuntime {
  if (typeof window === "undefined") {
    return { isCapacitor: false, platform: "web" };
  }

  const bridge = window.Capacitor;
  const isCapacitor = Boolean(bridge?.isNativePlatform?.());
  const platform = bridge?.getPlatform?.();

  if (isCapacitor && platform === "ios") {
    return { isCapacitor: true, platform: "ios" };
  }

  if (isCapacitor && platform === "android") {
    return { isCapacitor: true, platform: "android" };
  }

  return { isCapacitor, platform: "web" };
}
