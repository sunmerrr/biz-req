"use client";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4">
      <div className="text-center" role="alert">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          채팅 오류
        </h2>
        <p className="text-gray-500 mb-4 text-sm">
          {error.message || "채팅을 불러오는 중 오류가 발생했습니다."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
