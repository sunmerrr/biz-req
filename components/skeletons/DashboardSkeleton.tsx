export default function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"
        >
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="flex justify-between">
            <div className="h-3 bg-gray-100 rounded w-24" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
