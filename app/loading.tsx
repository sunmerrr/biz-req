export default function RootLoading() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    </main>
  );
}
