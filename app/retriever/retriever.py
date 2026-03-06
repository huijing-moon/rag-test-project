def get_retriever(vectorstore, k: int = 3):
    """Vector DB에서 관련 문서를 검색하는 retriever를 반환합니다."""
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    return retriever


def search_docs(retriever, query: str):
    """쿼리와 관련된 문서를 검색합니다."""
    docs = retriever.get_relevant_documents(query)
    return docs