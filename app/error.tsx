"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center" role="alert">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-gray-500 mb-4">
          {error.message || "알 수 없는 오류가 발생했습니다."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
