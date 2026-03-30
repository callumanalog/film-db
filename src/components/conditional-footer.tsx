"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";
import { isStockListFormFullscreenPath } from "@/lib/stock-list-form-route";

export function ConditionalFooter() {
  const pathname = usePathname();
  if (isStockListFormFullscreenPath(pathname)) return null;
  return <Footer />;
}
