import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-6" aria-busy="true">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
      <DashboardSkeleton />
    </main>
  );
}
