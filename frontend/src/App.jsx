import { useState } from "react";
import FileUpload from "./components/FileUpload";
import ChatBox from "./components/ChatBox";

export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      maxWidth: "800px",
      margin: "0 auto",
      boxShadow: "0 0 20px rgba(0,0,0,0.1)",
    }}>
      <div style={{
        padding: "14px 20px",
        backgroundColor: "#4f46e5",
        color: "#fff",
        fontSize: "18px",
        fontWeight: "bold",
      }}>
        📚 PDF 챗봇 (PDF에 관한 내용을 물어보세요!)
      </div>

      <FileUpload onUploaded={() => setReady(true)} onDeleted={() => setReady(false)} />
      <ChatBox ready={ready} />
    </div>
  );
}