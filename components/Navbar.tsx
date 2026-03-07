"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
  role: "biz" | "plan";
}

const ROLE_LABELS = {
  biz: "사업팀",
  plan: "기획자",
};

const ROLE_COLORS = {
  biz: "bg-blue-100 text-blue-700",
  plan: "bg-green-100 text-green-700",
};

export default function Navbar({ role }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary-700">BizReq</h1>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}
          >
            {ROLE_LABELS[role]}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
