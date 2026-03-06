import { useState } from "react";
import { uploadPDF, deletePDF } from "../services/api";

export default function FileUpload({ onUploaded, onDeleted }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus("업로드 중...");
    try {
      const data = await uploadPDF(file);
      setUploadedFile(file.name);
      setStatus(`✅ ${data.chunks}개 청크 인덱싱 완료`);
      onUploaded();
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!uploadedFile) return;
    setLoading(true);
    setStatus("삭제 중...");
    try {
      await deletePDF(uploadedFile);
      setUploadedFile(null);
      setStatus("");
      onDeleted();
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      padding: "12px 16px",
      borderBottom: "1px solid #e2e8f0",
      backgroundColor: "#f8fafc",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}>
      {!uploadedFile ? (
        <label style={{
          cursor: loading ? "not-allowed" : "pointer",
          padding: "6px 14px",
          backgroundColor: "#4f46e5",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "13px",
          opacity: loading ? 0.6 : 1,
        }}>
          📎 PDF 업로드
          <input
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={handleFile}
            disabled={loading}
          />
        </label>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            padding: "6px 12px",
            backgroundColor: "#e0e7ff",
            color: "#3730a3",
            borderRadius: "8px",
            fontSize: "13px",
            maxWidth: "300px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            📄 {uploadedFile}
          </span>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            🗑 삭제
          </button>
        </div>
      )}
      {status && <span style={{ fontSize: "13px", color: "#64748b" }}>{status}</span>}
    </div>
  );
}
