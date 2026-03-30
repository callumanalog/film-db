import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { BoardDetailClient } from "./board-detail-client";

type Props = { params: Promise<{ boardId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boardId } = await params;
  return {
    title: "Board",
    description: `Board on ${SITE_NAME}.`,
    // Dynamic name would require a server fetch; title updated client-side in header.
  };
}

export default async function BoardDetailPage({ params }: Props) {
  const { boardId } = await params;
  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden overflow-y-visible px-0 pt-0 pb-8 sm:px-6 lg:px-8 md:flex-none md:overflow-visible md:pb-8">
      <BoardDetailClient boardId={boardId} />
    </div>
  );
}
