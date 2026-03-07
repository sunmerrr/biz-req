export default function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}
