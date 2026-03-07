"use client";

import { useState } from "react";

interface Comment {
  id: number;
  parentId: number | null;
  role: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  requestId: string;
  initialComments: Comment[];
  canWrite: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  biz: "사업팀",
  plan: "기획자",
};

const ROLE_COLORS: Record<string, string> = {
  biz: "bg-blue-100 text-blue-700",
  plan: "bg-green-100 text-green-700",
};

export default function CommentSection({
  requestId,
  initialComments,
  canWrite,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function postComment(content: string, parentId: number | null) {
    const res = await fetch(`/api/comments/${requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });
    if (!res.ok) throw new Error("저장 실패");
    return await res.json();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    const content = input.trim();
    setSubmitting(true);
    setInput("");

    try {
      const saved = await postComment(content, null);
      setComments((prev) => [saved, ...prev]);
    } catch {
      alert("코멘트 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: number) {
    if (!replyInput.trim() || submitting) return;

    const content = replyInput.trim();
    setSubmitting(true);
    setReplyInput("");

    try {
      const saved = await postComment(content, parentId);
      setComments((prev) => [...prev, saved]);
      setReplyingTo(null);
    } catch {
      alert("답글 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const rootComments = comments.filter((c) => c.parentId == null);
  const getReplies = (parentId: number) =>
    comments.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-900">
        코멘트 ({comments.length})
      </h3>

      {canWrite && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="코멘트를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!input.trim() || submitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            등록
          </button>
        </form>
      )}

      {rootComments.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          아직 코멘트가 없습니다
        </p>
      ) : (
        <div className="space-y-3">
          {rootComments.map((comment) => {
            const replies = getReplies(comment.id);
            return (
              <div key={comment.id}>
                {/* 부모 댓글 */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[comment.role] || "bg-gray-100 text-gray-600"}`}
                    >
                      {ROLE_LABELS[comment.role] || comment.role}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{comment.content}</p>
                  {canWrite && (
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyInput("");
                      }}
                      className="text-xs text-gray-400 hover:text-primary-600 mt-2 transition-colors"
                    >
                      {replyingTo === comment.id ? "취소" : "답글"}
                    </button>
                  )}
                </div>

                {/* 대댓글 목록 */}
                {replies.length > 0 && (
                  <div className="ml-6 mt-2 space-y-2">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-gray-50 border border-gray-150 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[reply.role] || "bg-gray-100 text-gray-600"}`}
                          >
                            {ROLE_LABELS[reply.role] || reply.role}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(reply.createdAt).toLocaleString("ko-KR")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 답글 입력 */}
                {replyingTo === comment.id && canWrite && (
                  <div className="ml-6 mt-2 flex gap-2">
                    <input
                      type="text"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder="답글을 입력하세요..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      disabled={submitting}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(comment.id);
                        }
                        if (e.key === "Escape") setReplyingTo(null);
                      }}
                    />
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyInput.trim() || submitting}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      등록
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
