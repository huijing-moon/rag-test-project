import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import { askQuestion } from "../services/api";

export default function ChatBox({ ready }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const data = await askQuestion(q);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px", fontSize: "14px" }}>
            {ready ? "PDF 문서에 대해 질문하세요." : "먼저 PDF를 업로드해주세요."}
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} sources={msg.sources} />
        ))}
        {loading && (
          <Message role="assistant" content="답변 생성 중..." />
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        gap: "8px",
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={ready ? "질문을 입력하세요... (Enter로 전송)" : "PDF를 먼저 업로드해주세요"}
          disabled={!ready || loading}
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!ready || loading || !input.trim()}
          style={{
            padding: "10px 18px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            opacity: (!ready || loading || !input.trim()) ? 0.5 : 1,
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}