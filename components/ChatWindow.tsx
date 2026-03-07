"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "./MessageBubble";
import PreviewModal from "./PreviewModal";

interface Message {
  id?: number;
  role: string;
  content: string;
}

interface ChatWindowProps {
  requestId: string;
  initialMessages: Message[];
  initialStatus: string;
}

export default function ChatWindow({
  requestId,
  initialMessages,
  initialStatus,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionStep, setCompletionStep] = useState("");
  const [status, setStatus] = useState(initialStatus === "completed" ? "chatting" : initialStatus);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewStep, setPreviewStep] = useState("");
  const [previewData, setPreviewData] = useState<{
    requirementDoc: string | null;
    prototypeHtml: string | null;
  }>({ requirementDoc: null, prototypeHtml: null });
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Optimistic UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch(`/api/chat/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "전송 실패");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // 취소됨 — 사용자 메시지도 제거
        setMessages((prev) => prev.slice(0, -1));
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
          },
        ]);
      }
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  }

  function handleCancelSend() {
    abortRef.current?.abort();
  }

  async function handleComplete() {
    if (completing) return;
    setCompleting(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Step 1: Generate requirement doc
      setCompletionStep("요구사항 문서 생성 중...");
      const completeRes = await fetch(`/api/chat/${requestId}/complete`, {
        method: "POST",
        signal: controller.signal,
      });

      if (!completeRes.ok) {
        const data = await completeRes.json();
        throw new Error(data.error?.message || "문서 생성 실패");
      }

      setStatus("completed");
      setCompletionStep("완료! 문서를 확인하세요...");

      setTimeout(() => {
        router.push(`/request/${requestId}`);
      }, 1000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setCompletionStep("");
        setStatus("chatting");
      } else {
        setCompletionStep("");
        setStatus("chatting");
        alert(error instanceof Error ? error.message : "생성에 실패했습니다.");
      }
    } finally {
      abortRef.current = null;
      setCompleting(false);
    }
  }

  function handleCancelComplete() {
    abortRef.current?.abort();
  }

  async function handlePreview() {
    if (previewing) return;
    setPreviewing(true);
    setShowPreview(true);
    setPreviewData({ requirementDoc: null, prototypeHtml: null });

    const controller = new AbortController();
    previewAbortRef.current = controller;

    try {
      setPreviewStep("요구사항 문서 & 프로토타입 생성 중...");
      const res = await fetch(`/api/chat/${requestId}/preview`, {
        method: "POST",
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "미리보기 생성 실패");
      }

      const data = await res.json();
      setPreviewData({
        requirementDoc: data.requirementDoc,
        prototypeHtml: data.prototypeHtml,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShowPreview(false);
      } else {
        setShowPreview(false);
        alert(error instanceof Error ? error.message : "미리보기 생성에 실패했습니다.");
      }
    } finally {
      previewAbortRef.current = null;
      setPreviewing(false);
      setPreviewStep("");
    }
  }

  function handleCancelPreview() {
    previewAbortRef.current?.abort();
  }

  function handleClosePreview() {
    setShowPreview(false);
    setPreviewData({ requirementDoc: null, prototypeHtml: null });
  }

  const isChatting = status === "chatting";

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {sending && (
          <div className="flex justify-start items-center gap-2">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
            <button
              onClick={handleCancelSend}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              취소
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Completion loading */}
      {completionStep && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-yellow-700">{completionStep}</span>
            <button
              onClick={handleCancelComplete}
              className="text-xs text-yellow-600 hover:text-red-500 ml-2 transition-colors"
            >
              중단
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      {isChatting && (
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="메시지를 입력하세요... (Shift+Enter: 줄바꿈)"
              rows={1}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none overflow-y-auto max-h-32"
              disabled={completing || previewing}
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || completing || previewing}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </form>

          <div className="mt-2 flex justify-end gap-3">
            <button
              onClick={handlePreview}
              disabled={messages.length < 3 || sending || completing || previewing}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              미리보기
            </button>
            <button
              onClick={handleComplete}
              disabled={messages.length < 3 || completing || previewing}
              className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              대화 완료 & 문서 생성
            </button>
          </div>
        </div>
      )}

      {showPreview && (
        <PreviewModal
          requirementDoc={previewData.requirementDoc}
          prototypeHtml={previewData.prototypeHtml}
          loading={previewing}
          loadingStep={previewStep}
          onClose={handleClosePreview}
          onCancel={handleCancelPreview}
        />
      )}

      {status === "completed" && !completionStep && (
        <div className="border-t border-gray-200 bg-green-50 p-4 text-center">
          <button
            onClick={() => router.push(`/request/${requestId}`)}
            className="text-sm text-green-700 hover:text-green-800 font-medium"
          >
            결과 보기
          </button>
        </div>
      )}
    </div>
  );
}
