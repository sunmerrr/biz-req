"use client";

import { useState, useEffect, useCallback } from "react";

interface VersionItem {
  id: number;
  version: number;
  type: string;
  createdAt: string;
}

interface VersionSelectorProps {
  requestId: string;
  type: "doc" | "prototype";
  refreshTrigger: number;
  onVersionSelect: (content: string | null) => void;
}

export default function VersionSelector({
  requestId,
  type,
  refreshTrigger,
  onVersionSelect,
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("latest");
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/requests/${requestId}/versions?type=${type}`
      );
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
      }
    } catch {
      // 조용히 실패
    }
  }, [requestId, type]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions, refreshTrigger]);

  // refreshTrigger 변경 시 최신으로 리셋
  useEffect(() => {
    setSelectedId("latest");
  }, [refreshTrigger]);

  async function handleChange(value: string) {
    setSelectedId(value);

    if (value === "latest") {
      onVersionSelect(null);
      return;
    }

    const versionId = parseInt(value, 10);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/requests/${requestId}/versions/${versionId}`
      );
      if (res.ok) {
        const data = await res.json();
        onVersionSelect(data.version.content);
      }
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  }

  // 버전이 1개 이하면 표시하지 않음
  if (versions.length <= 1) {
    return null;
  }

  const latestVersion = versions[0];
  const isViewingPast = selectedId !== "latest";

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedId}
          onChange={(e) => handleChange(e.target.value)}
          disabled={loading}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
        >
          <option value="latest">
            v{latestVersion.version} - {formatDate(latestVersion.createdAt)} (최신)
          </option>
          {versions.slice(1).map((v) => (
            <option key={v.id} value={String(v.id)}>
              v{v.version} - {formatDate(v.createdAt)}
            </option>
          ))}
        </select>
        {loading && (
          <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {isViewingPast && (
        <div className="mt-2 flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-2 text-sm">
          <span>
            과거 버전을 보고 있습니다.
          </span>
          <button
            onClick={() => handleChange("latest")}
            className="text-amber-800 font-medium underline hover:text-amber-900"
          >
            최신으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
