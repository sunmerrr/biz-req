"use client";

import { useRouter } from "next/navigation";

interface RequestCardProps {
  id: string;
  title: string;
  createdAt: string;
  commentCount: number;
}

export default function RequestCard({
  id,
  title,
  createdAt,
  commentCount,
}: RequestCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/request/${id}`)}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
    >
      <h3 className="font-medium text-gray-900 group-hover:text-primary-700 mb-2 line-clamp-2">
        {title}
      </h3>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{new Date(createdAt).toLocaleDateString("ko-KR")}</span>
        <span>
          코멘트 {commentCount}개
        </span>
      </div>
    </button>
  );
}
