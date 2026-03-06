from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


def create_vectorstore(docs):
    """문서 청크를 임베딩하여 FAISS Vector DB를 생성합니다."""
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(docs, embeddings)
    return vectorstore


def save_vectorstore(vectorstore, path: str = "data/faiss_index"):
    """Vector DB를 로컬에 저장합니다."""
    vectorstore.save_local(path)


def load_vectorstore(path: str = "data/faiss_index"):
    """로컬에 저장된 Vector DB를 불러옵니다."""
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
    return vectorstore