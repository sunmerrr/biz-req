interface MessageBubbleProps {
  role: string;
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-primary-500 text-white rounded-br-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
