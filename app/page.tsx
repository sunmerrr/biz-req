"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "로그인에 실패했습니다.");
        return;
      }

      const data = await res.json();
      if (data.role === "biz") {
        router.push("/chat");
      } else if (data.role === "plan") {
        router.push("/dashboard");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">BizReq</h1>
          <p className="text-gray-500">
            사업팀 요구사항 수집 & 프로토타입 자동 생성
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              팀 코드
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="팀 코드를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            사업팀: <code className="bg-gray-100 px-1 rounded">biz</code> /
            기획자: <code className="bg-gray-100 px-1 rounded">plan</code>
          </p>
        </form>
      </div>
    </main>
  );
}
