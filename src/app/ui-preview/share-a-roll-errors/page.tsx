import type { Metadata } from "next";
import { ShareARollUxMessagesPreview } from "./share-a-roll-errors-preview";

export const metadata: Metadata = {
  title: "Preview: share-a-roll - UX messages",
  robots: { index: false, follow: false },
};

export default function ShareARollUxMessagesPreviewPage() {
  return <ShareARollUxMessagesPreview />;
}
