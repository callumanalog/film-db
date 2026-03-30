import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME } from "@/lib/site";
import { StockListFormClient } from "@/components/stock-list-form-client";

export const metadata: Metadata = {
  title: "Create a list",
  description: `Create a film stock list on ${SITE_NAME}.`,
};

function FormFallback() {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white dark:bg-background"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function NewStockListPage() {
  return (
    <Suspense fallback={<FormFallback />}>
      <StockListFormClient mode="create" />
    </Suspense>
  );
}
