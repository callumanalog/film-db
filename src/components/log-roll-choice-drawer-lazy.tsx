"use client";

import dynamic from "next/dynamic";

const LogRollChoiceDrawer = dynamic(
  () => import("@/components/log-roll-choice-drawer").then((m) => ({ default: m.LogRollChoiceDrawer })),
  { ssr: false }
);

export function LogRollChoiceDrawerLazy() {
  return <LogRollChoiceDrawer />;
}
