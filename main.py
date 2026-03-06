import os
from dotenv import load_dotenv

from app.loader.pdf_loader import load_and_split
from app.embedding.embedder import create_vectorstore, save_vectorstore, load_vectorstore
from app.retriever.retriever import get_retriever
from app.chain.qa_chain import create_qa_chain, ask

load_dotenv()

PDF_PATH = "data/paper.pdf"
INDEX_PATH = "data/faiss_index"


def build_index(pdf_path: str):
    print("PDF 로딩 및 텍스트 분할 중...")
    docs = load_and_split(pdf_path)
    print(f"총 {len(docs)}개 청크 생성 완료")

    print("임베딩 생성 및 Vector DB 저장 중...")
    vectorstore = create_vectorstore(docs)
    save_vectorstore(vectorstore, INDEX_PATH)
    print(f"Vector DB 저장 완료: {INDEX_PATH}")
    return vectorstore


def main():
    # Vector DB가 이미 있으면 불러오고, 없으면 새로 생성
    if os.path.exists(INDEX_PATH):
        print("저장된 Vector DB 불러오는 중...")
        vectorstore = load_vectorstore(INDEX_PATH)
    else:
        if not os.path.exists(PDF_PATH):
            print(f"PDF 파일이 없습니다: {PDF_PATH}")
            print("data/ 폴더에 paper.pdf 파일을 넣고 다시 실행하세요.")
            return
        vectorstore = build_index(PDF_PATH)

    retriever = get_retriever(vectorstore, k=3)
    qa_chain = create_qa_chain(retriever)

    print("\nRAG 챗봇 준비 완료! (종료: 'q' 입력)")
    print("-" * 50)

    while True:
        question = input("\n질문: ").strip()
        if question.lower() == "q":
            print("종료합니다.")
            break
        if not question:
            continue

        answer, sources = ask(qa_chain, question)
        print(f"\n답변: {answer}")

        print("\n[참고 출처]")
        for i, doc in enumerate(sources, 1):
            page = doc.metadata.get("page", "?")
            print(f"  {i}. 페이지 {page + 1}: {doc.page_content[:80]}...")


if __name__ == "__main__":
    main()