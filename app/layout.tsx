import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizReq — 요구사항 수집 & 프로토타입 생성",
  description: "사업팀 요구사항을 AI로 정리하고 프로토타입을 자동 생성합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
