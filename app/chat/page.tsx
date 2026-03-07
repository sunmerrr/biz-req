"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface RequestItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  chatting: "대화 중",
  doc_generating: "문서 생성 중",
  proto_generating: "프로토타입 생성 중",
  completed: "완료",
};

const STATUS_COLORS: Record<string, string> = {
  chatting: "bg-status-chatting text-white",
  doc_generating: "bg-status-generating text-gray-800",
  proto_generating: "bg-status-generating text-gray-800",
  completed: "bg-status-completed text-white",
};

export default function ChatListPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/chat/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/chat", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id: string) {
    if (!editTitle.trim()) return;
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim() }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title: editTitle.trim() } : r))
      );
    }
    setEditingId(null);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" 요구사항을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <>
      <Navbar role="biz" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">요구사항 목록</h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
          >
            {creating ? "생성 중..." : "새 요구사항 등록"}
          </button>
        </div>

        {loading ? (
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
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">아직 등록된 요구사항이 없습니다</p>
            <p className="text-sm">
              &quot;새 요구사항 등록&quot; 버튼을 눌러 시작하세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                {editingId === req.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRename(req.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      type="submit"
                      className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                    >
                      취소
                    </button>
                  </form>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      req.status === "completed"
                        ? router.push(`/request/${req.id}`)
                        : router.push(`/chat/${req.id}`)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{req.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(req.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                )}

                {editingId !== req.id && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(req.id);
                        setEditTitle(req.title);
                      }}
                      className="text-xs text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      이름 변경
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(req.id, req.title);
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
