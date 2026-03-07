"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RequirementDocProps {
  content: string;
}

export default function RequirementDoc({ content }: RequirementDocProps) {
  return (
    <article className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3 prose-h1:mb-6 prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-primary-700 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-table:text-sm prose-th:bg-gray-50 prose-th:text-gray-700 prose-th:font-semibold prose-td:text-gray-600 prose-hr:my-6">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </article>
  );
}
