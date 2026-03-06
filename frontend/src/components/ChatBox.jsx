import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import { askQuestion, summarizePDF } from "../services/api";

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

  async function handleSummarize() {
    if (loading) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: "📋 문서 요약해줘" }]);
    try {
      const data = await summarizePDF();
      setMessages((prev) => [...prev, { role: "assistant", content: data.summary }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${err.message}` }]);
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
        {messages.length === 0 && ready && (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "12px" }}>
              PDF 문서에 대해 질문하거나 요약을 요청하세요.
            </p>
            <button
              onClick={handleSummarize}
              disabled={loading}
              style={{
                padding: "8px 20px",
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
                border: "1px solid #bbf7d0",
                borderRadius: "20px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              📋 문서 요약하기
            </button>
          </div>
        )}
        {messages.length === 0 && !ready && (
          <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px", fontSize: "14px" }}>
            먼저 PDF를 업로드해주세요.
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
        flexDirection: "column",
        gap: "8px",
      }}>
        {ready && (
          <button
            onClick={handleSummarize}
            disabled={loading}
            style={{
              alignSelf: "flex-start",
              padding: "4px 12px",
              backgroundColor: "#f0fdf4",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              fontSize: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            📋 요약
          </button>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
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
    </div>
  );
}