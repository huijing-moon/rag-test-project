export default function Message({ role, content, sources }) {
  const isUser = role === "user";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "12px",
    }}>
      <div style={{
        maxWidth: "70%",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        backgroundColor: isUser ? "#4f46e5" : "#f1f5f9",
        color: isUser ? "#fff" : "#1e293b",
        fontSize: "14px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
      }}>
        {content}
        {sources && sources.length > 0 && (
          <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.75 }}>
            {sources.map((s, i) => (
              <div key={i}>📄 p.{s.page}: {s.content}...</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}