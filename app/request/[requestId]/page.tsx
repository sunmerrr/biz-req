"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RequirementDoc from "@/components/RequirementDoc";
import PrototypePreview from "@/components/PrototypePreview";
import CommentSection from "@/components/CommentSection";
import VersionSelector from "@/components/VersionSelector";

interface RequestData {
  id: string;
  title: string;
  status: string;
  requirementDoc: string | null;
  prototypeHtml: string | null;
  createdAt: string;
}

interface Comment {
  id: number;
  parentId: number | null;
  role: string;
  content: string;
  createdAt: string;
}

export default function RequestResultPage() {
  const params = useParams();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [role, setRole] = useState<"biz" | "plan">("biz");
  const [activeTab, setActiveTab] = useState<"doc" | "prototype">("doc");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState("");
  const [docVersionContent, setDocVersionContent] = useState<string | null>(null);
  const [protoVersionContent, setProtoVersionContent] = useState<string | null>(null);
  const [docRefreshTrigger, setDocRefreshTrigger] = useState(0);
  const [protoRefreshTrigger, setProtoRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setRequest(data.request);
          setComments(data.comments);
          if (data.role) setRole(data.role);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [requestId]);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerateDoc() {
    setRegenerating("doc");
    try {
      const res = await fetch(`/api/chat/${requestId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("재생성 실패");
      const data = await res.json();
      setRequest(prev => prev ? { ...prev, requirementDoc: data.requirementDoc, status: data.status } : null);
      setDocVersionContent(null);
      setDocRefreshTrigger(prev => prev + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "재생성에 실패했습니다.");
    } finally {
      setRegenerating("");
    }
  }

  async function handleGeneratePrototype() {
    setRegenerating("prototype");
    try {
      const res = await fetch(`/api/chat/${requestId}/prototype`, { method: "POST" });
      if (!res.ok) throw new Error("프로토타입 생성 실패");
      const refreshRes = await fetch(`/api/requests/${requestId}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setRequest(data.request);
      }
      setProtoVersionContent(null);
      setProtoRefreshTrigger(prev => prev + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "프로토타입 생성에 실패했습니다.");
    } finally {
      setRegenerating("");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar role={role} />
        <main className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6" />
          <div className="h-64 bg-gray-100 rounded" />
        </main>
      </>
    );
  }

  if (!request) {
    return (
      <>
        <Navbar role={role} />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">요청을 찾을 수 없습니다.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar role={role} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{request.title}</h2>
          <div className="flex items-center gap-3">
            {role === "biz" && (
              <button
                onClick={() => router.push(`/chat/${requestId}`)}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                대화 이어하기
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              {copied ? "복사됨!" : "링크 복사"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("doc")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "doc"
                ? "border-primary-500 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            요구사항 문서
          </button>
          <button
            onClick={() => setActiveTab("prototype")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "prototype"
                ? "border-primary-500 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            프로토타입
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          {activeTab === "doc" && request.requirementDoc ? (
            <div>
              <VersionSelector
                requestId={requestId}
                type="doc"
                refreshTrigger={docRefreshTrigger}
                onVersionSelect={(content) => setDocVersionContent(content)}
              />
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <RequirementDoc content={docVersionContent ?? request.requirementDoc} />
              </div>
              {role === "biz" && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleRegenerateDoc}
                    disabled={!!regenerating}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {regenerating === "doc" && (
                      <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {regenerating === "doc" ? "재생성 중..." : "요구사항 재생성"}
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === "doc" ? (
            <p className="text-gray-400 text-center py-12">
              요구사항 문서가 아직 생성되지 않았습니다.
            </p>
          ) : activeTab === "prototype" && request.prototypeHtml ? (
            <div>
              <VersionSelector
                requestId={requestId}
                type="prototype"
                refreshTrigger={protoRefreshTrigger}
                onVersionSelect={(content) => setProtoVersionContent(content)}
              />
              <PrototypePreview html={protoVersionContent ?? request.prototypeHtml} />
              {role === "biz" && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleGeneratePrototype}
                    disabled={!!regenerating}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {regenerating === "prototype" && (
                      <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {regenerating === "prototype" ? "재생성 중..." : "프로토타입 재생성"}
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === "prototype" ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                프로토타입이 아직 생성되지 않았습니다.
              </p>
              {role === "biz" && (
                <button
                  onClick={handleGeneratePrototype}
                  disabled={!!regenerating || !request.requirementDoc}
                  className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {regenerating === "prototype" && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {regenerating === "prototype" ? "생성 중..." : "프로토타입 생성"}
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Comments */}
        <div className="border-t border-gray-200 pt-6">
          <CommentSection
            requestId={requestId}
            initialComments={comments}
            canWrite={true}
          />
        </div>
      </main>
    </>
  );
}
