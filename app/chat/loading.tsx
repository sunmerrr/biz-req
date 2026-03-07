import ChatListSkeleton from "@/components/skeletons/ChatListSkeleton";

export default function ChatLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6" aria-busy="true">
      <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
      <ChatListSkeleton />
    </main>
  );
}
