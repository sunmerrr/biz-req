export default function ResultSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-10 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-100 rounded w-32" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}
