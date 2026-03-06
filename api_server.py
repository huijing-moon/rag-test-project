import os
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.loader.pdf_loader import load_and_split
from app.embedding.embedder import create_vectorstore, save_vectorstore, load_vectorstore
from app.retriever.retriever import get_retriever
from app.chain.qa_chain import create_qa_chain, ask

load_dotenv()

INDEX_PATH = "data/faiss_index"
DATA_DIR = "data"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 qa_chain (서버 시작 시 또는 업로드 후 초기화)
qa_chain = None


def init_chain():
    global qa_chain
    if os.path.exists(INDEX_PATH):
        vectorstore = load_vectorstore(INDEX_PATH)
        retriever = get_retriever(vectorstore, k=3)
        qa_chain = create_qa_chain(retriever)


# 서버 시작 시 기존 인덱스 로드
init_chain()


class ChatRequest(BaseModel):
    question: str


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global qa_chain

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다.")

    os.makedirs(DATA_DIR, exist_ok=True)
    file_path = os.path.join(DATA_DIR, file.filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # 임베딩 생성 및 저장
    docs = load_and_split(file_path)
    vectorstore = create_vectorstore(docs)
    save_vectorstore(vectorstore, INDEX_PATH)

    retriever = get_retriever(vectorstore, k=3)
    qa_chain = create_qa_chain(retriever)

    return {"message": f"{file.filename} 업로드 및 인덱싱 완료", "chunks": len(docs)}


@app.post("/chat")
async def chat(req: ChatRequest):
    if qa_chain is None:
        raise HTTPException(status_code=400, detail="먼저 PDF를 업로드해주세요.")

    answer, sources = ask(qa_chain, req.question)

    source_list = [
        {
            "page": doc.metadata.get("page", 0) + 1,
            "content": doc.page_content[:100]
        }
        for doc in sources
    ]

    return {"answer": answer, "sources": source_list}


@app.delete("/delete/{filename}")
async def delete_pdf(filename: str):
    global qa_chain

    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")

    os.remove(file_path)

    # FAISS 인덱스 삭제
    import shutil
    if os.path.exists(INDEX_PATH):
        shutil.rmtree(INDEX_PATH)

    qa_chain = None
    return {"message": f"{filename} 삭제 완료"}


@app.get("/health")
def health():
    return {"status": "ok", "index_loaded": qa_chain is not None}