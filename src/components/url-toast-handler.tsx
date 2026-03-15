"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToastViaEvent } from "@/components/toast";

/**
 * When the URL contains a `toast` search param (e.g. after sign-up redirect),
 * show the toast and replace the URL without the param so it doesn't re-show on refresh.
 */
export function UrlToastHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (!toastParam) return;
    try {
      showToastViaEvent(decodeURIComponent(toastParam));
    } catch {
      showToastViaEvent(toastParam);
    }
    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    const qs = next.toString();
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const replace = qs ? `${path}?${qs}` : path;
    router.replace(replace, { scroll: false });
  }, [searchParams, router]);

  return null;
}
