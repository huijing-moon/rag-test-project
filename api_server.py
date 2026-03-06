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

    existing_pdfs = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    if len(existing_pdfs) >= 2:
        raise HTTPException(status_code=400, detail="최대 2개의 PDF만 업로드 가능합니다.")
    if file.filename in existing_pdfs:
        raise HTTPException(status_code=400, detail="이미 업로드된 파일입니다.")

    file_path = os.path.join(DATA_DIR, file.filename)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # 전체 PDF로 벡터스토어 재구성
    all_docs = []
    for pdf_name in os.listdir(DATA_DIR):
        if pdf_name.endswith(".pdf"):
            all_docs.extend(load_and_split(os.path.join(DATA_DIR, pdf_name)))

    vectorstore = create_vectorstore(all_docs)
    save_vectorstore(vectorstore, INDEX_PATH)

    retriever = get_retriever(vectorstore, k=3)
    qa_chain = create_qa_chain(retriever)

    return {"message": f"{file.filename} 업로드 및 인덱싱 완료", "chunks": len(all_docs)}


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
    import shutil

    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")

    os.remove(file_path)

    remaining_pdfs = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    if remaining_pdfs:
        # 남은 PDF로 벡터스토어 재구성
        all_docs = []
        for pdf_name in remaining_pdfs:
            all_docs.extend(load_and_split(os.path.join(DATA_DIR, pdf_name)))
        vectorstore = create_vectorstore(all_docs)
        save_vectorstore(vectorstore, INDEX_PATH)
        retriever = get_retriever(vectorstore, k=3)
        qa_chain = create_qa_chain(retriever)
    else:
        if os.path.exists(INDEX_PATH):
            shutil.rmtree(INDEX_PATH)
        qa_chain = None

    return {"message": f"{filename} 삭제 완료"}


@app.post("/summarize")
async def summarize():
    if qa_chain is None:
        raise HTTPException(status_code=400, detail="먼저 PDF를 업로드해주세요.")

    pdfs = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    all_docs = []
    for pdf_name in pdfs:
        all_docs.extend(load_and_split(os.path.join(DATA_DIR, pdf_name)))

    # 앞부분 청크만 사용해 요약 (너무 길면 토큰 초과)
    sample_text = "\n\n".join(doc.page_content for doc in all_docs[:20])

    from langchain_anthropic import ChatAnthropic
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    llm = ChatAnthropic(model="claude-sonnet-4-6", temperature=0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "다음 문서 내용을 한국어로 핵심만 간결하게 요약해주세요. 주요 주제, 핵심 내용, 중요 포인트를 포함하세요."),
        ("human", "{text}"),
    ])
    chain = prompt | llm | StrOutputParser()
    summary = chain.invoke({"text": sample_text})

    return {"summary": summary}


@app.get("/files")
def list_files():
    pdfs = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    return {"files": pdfs}


@app.get("/health")
def health():
    return {"status": "ok", "index_loaded": qa_chain is not None}