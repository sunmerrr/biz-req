"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import RequestCard from "@/components/RequestCard";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

interface RequestItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export default function DashboardPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/requests");
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Navbar role="plan" />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          전달된 요구사항
        </h2>

        {loading ? (
          <DashboardSkeleton />
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">
              아직 전달된 요구사항이 없습니다
            </p>
            <p className="text-sm">
              사업팀에서 요구사항을 완료하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                id={req.id}
                title={req.title}
                createdAt={req.createdAt}
                commentCount={req.commentCount}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
