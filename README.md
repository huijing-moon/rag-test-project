# PDF RAG 챗봇

PDF 문서를 업로드하면 내용을 기반으로 질문에 답변하는 RAG(Retrieval-Augmented Generation) 챗봇입니다.
LangChain + FAISS + Claude(Anthropic) + FastAPI + React로 구성됩니다.

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| LLM | Claude (claude-sonnet-4-6) |
| 임베딩 | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB | FAISS |
| 프레임워크 | LangChain (LCEL) |
| PDF 파싱 | PyPDFLoader (LangChain) |
| API 서버 | FastAPI + Uvicorn |
| 프론트엔드 | React + Vite |

## 프로젝트 구조

```
RAG-test-project/
├── main.py              # CLI 실행 진입점
├── api_server.py        # FastAPI 서버 (REST API)
├── requirements.txt
├── .env                 # API 키 설정
├── data/
│   ├── *.pdf            # 업로드된 PDF 문서
│   └── faiss_index/     # Vector DB (자동 생성)
├── app/
│   ├── loader/
│   │   └── pdf_loader.py    # PDF 로드 및 텍스트 분할
│   ├── embedding/
│   │   └── embedder.py      # 임베딩 생성 및 FAISS 저장/로드
│   ├── retriever/
│   │   └── retriever.py     # 유사 문서 검색
│   └── chain/
│       └── qa_chain.py      # LLM QA 체인 구성
└── frontend/            # React 프론트엔드
    └── src/
        ├── components/
        │   ├── ChatBox.jsx
        │   ├── Message.jsx
        │   └── FileUpload.jsx
        ├── services/
        │   └── api.js
        └── App.jsx
```

## 시작하기

### 1. 의존성 설치

```bash
pip install -r requirements.txt
pip install fastapi uvicorn python-multipart
```

```bash
cd frontend
npm install
```

### 2. 환경 변수 설정

`.env` 파일에 Anthropic API 키를 입력합니다.

```
ANTHROPIC_API_KEY=your-api-key-here
```

### 3. 실행

**터미널 1 — FastAPI 서버:**
```bash
uvicorn api_server:app --reload --port 8000
```

**터미널 2 — React 프론트엔드:**
```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/upload` | PDF 파일 업로드 및 인덱싱 |
| POST | `/chat` | 질문 전송 및 답변 수신 |
| DELETE | `/delete/{filename}` | PDF 및 인덱스 삭제 |
| GET | `/health` | 서버 상태 확인 |

## 동작 방식

1. PDF 업로드 → `PyPDFLoader`로 로드 → `RecursiveCharacterTextSplitter`로 청크 분할
2. 청크 임베딩 생성 → FAISS 인덱스 저장
3. 질문 입력 → 관련 청크 3개 검색 → Claude가 문서 기반으로 답변 생성
4. 답변 + 참고 페이지 번호 반환

## CLI 모드 (FastAPI 없이 실행)

```bash
python main.py
```