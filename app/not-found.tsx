import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-6xl font-bold text-gray-300 mb-4">404</h2>
        <p className="text-xl text-gray-600 mb-6">
          페이지를 찾을 수 없습니다
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
