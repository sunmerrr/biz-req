import { db } from "@/lib/db";
import { requests, messages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChatWindow from "@/components/ChatWindow";

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  const [req] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));

  if (!req) {
    notFound();
  }

  const msgs = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.requestId, requestId));

  return (
    <>
      <Navbar role="biz" />
      <ChatWindow
        requestId={requestId}
        initialMessages={msgs}
        initialStatus={req.status}
      />
    </>
  );
}
