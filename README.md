# RAG Chatbot

PDF 문서를 기반으로 질문에 답하는 RAG(Retrieval-Augmented Generation) 챗봇입니다.
LangChain + FAISS + Claude(Anthropic)를 사용합니다.

## 구조

```
RAG-test-project/
├── main.py                  # 진입점
├── requirements.txt
├── .env                     # API 키 설정
├── data/
│   ├── paper.pdf            # 질의할 PDF 문서
│   └── faiss_index/         # 생성된 Vector DB (자동 생성)
└── app/
    ├── loader/
    │   └── pdf_loader.py    # PDF 로드 및 텍스트 분할
    ├── embedding/
    │   └── embedder.py      # 임베딩 생성 및 FAISS 저장/로드
    ├── retriever/
    │   └── retriever.py     # 유사 문서 검색
    └── chain/
        └── qa_chain.py      # LLM QA 체인 구성
```

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| LLM | Claude (claude-sonnet-4-6) |
| 임베딩 | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB | FAISS |
| 프레임워크 | LangChain 1.x (LCEL) |
| PDF 파싱 | PyPDF |

## 시작하기

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일에 Anthropic API 키를 입력합니다.

```
ANTHROPIC_API_KEY=your-api-key-here
```

### 3. PDF 파일 준비

`data/` 폴더에 `paper.pdf` 파일을 넣습니다.

### 4. 실행

```bash
python main.py
```

## 동작 방식

1. **첫 실행**: `paper.pdf`를 청크로 분할 → 임베딩 생성 → FAISS 인덱스 저장
2. **이후 실행**: 저장된 FAISS 인덱스를 불러와 바로 사용
3. 질문 입력 → 관련 문서 3개 검색 → Claude가 문서 기반으로 답변 생성
4. `q` 입력 시 종료