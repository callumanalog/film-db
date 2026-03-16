import type { Metadata } from "next";
import { VaultPageClient } from "./vault-page-client";

export const metadata: Metadata = {
  title: "The Vault",
  description: "Your logged rolls — track film in the fridge, in camera, processing, and scanned.",
};

export default function VaultPage() {
  return <VaultPageClient />;
}
