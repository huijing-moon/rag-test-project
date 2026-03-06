export const BASE_URL = "http://localhost:8000";

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "업로드 실패");
  }
  return res.json();
}

export async function deletePDF(filename) {
  const res = await fetch(`${BASE_URL}/delete/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "삭제 실패");
  }
  return res.json();
}

export async function askQuestion(question) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "질문 처리 실패");
  }
  return res.json();
}