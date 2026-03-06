import { useState, useEffect } from "react";
import { uploadPDF, deletePDF } from "../services/api";
import { BASE_URL } from "../services/api";

export default function FileUpload({ onUploaded, onDeleted }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // 서버에 이미 있는 PDF 목록 동기화
  useEffect(() => {
    fetch(`${BASE_URL}/files`)
      .then(r => r.json())
      .then(data => {
        setUploadedFiles(data.files);
        if (data.files.length > 0) onUploaded();
      })
      .catch(() => {});
  }, []);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus("업로드 중...");
    try {
      const data = await uploadPDF(file);
      setUploadedFiles(prev => [...prev, file.name]);
      setStatus(`✅ ${data.chunks}개 청크 인덱싱 완료`);
      onUploaded();
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(filename) {
    setLoading(true);
    setStatus("삭제 중...");
    try {
      await deletePDF(filename);
      const remaining = uploadedFiles.filter(f => f !== filename);
      setUploadedFiles(remaining);
      setStatus("");
      if (remaining.length === 0) {
        onDeleted();
      }
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const canUploadMore = uploadedFiles.length < 2;

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
      {uploadedFiles.map(filename => (
        <div key={filename} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            padding: "6px 12px",
            backgroundColor: "#e0e7ff",
            color: "#3730a3",
            borderRadius: "8px",
            fontSize: "13px",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            📄 {filename}
          </span>
          <button
            onClick={() => handleDelete(filename)}
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
      ))}

      {canUploadMore && (
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
      )}

      {status && <span style={{ fontSize: "13px", color: "#64748b" }}>{status}</span>}
    </div>
  );
}
