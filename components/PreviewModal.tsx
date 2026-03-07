"use client";

import { useState, useEffect } from "react";
import RequirementDoc from "./RequirementDoc";
import PrototypePreview from "./PrototypePreview";

interface PreviewModalProps {
  requirementDoc: string | null;
  prototypeHtml: string | null;
  loading: boolean;
  loadingStep: string;
  onClose: () => void;
  onCancel: () => void;
}

export default function PreviewModal({
  requirementDoc,
  prototypeHtml,
  loading,
  loadingStep,
  onClose,
  onCancel,
}: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"doc" | "prototype">("doc");

  // ESC 키로 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  // body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={!loading ? onClose : undefined}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">미리보기</h2>
          <button
            onClick={!loading ? onClose : undefined}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 */}
        {!loading && (
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab("doc")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "doc"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              요구사항 문서
            </button>
            <button
              onClick={() => setActiveTab("prototype")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "prototype"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              프로토타입
            </button>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">{loadingStep}</p>
              <button
                onClick={onCancel}
                className="mt-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                취소
              </button>
            </div>
          ) : activeTab === "doc" && requirementDoc ? (
            <RequirementDoc content={requirementDoc} />
          ) : activeTab === "prototype" && prototypeHtml ? (
            <PrototypePreview html={prototypeHtml} />
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-400">데이터가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {!loading && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">미리보기 결과는 저장되지 않습니다.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              닫고 대화 계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
