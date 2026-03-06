from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser


PROMPT = ChatPromptTemplate.from_messages([
    ("system", "다음 문서를 참고하여 질문에 답하세요.\n\n{context}"),
    ("human", "{question}"),
])


def _format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def create_qa_chain(retriever, model_name: str = "claude-sonnet-4-6"):
    """Retriever와 Claude LLM을 연결한 QA 체인을 생성합니다."""
    llm = ChatAnthropic(model=model_name, temperature=0)

    qa_chain = RunnableParallel(
        context=retriever,
        question=RunnablePassthrough()
    ).assign(
        answer=(
            lambda x: {"context": _format_docs(x["context"]), "question": x["question"]}
        ) | PROMPT | llm | StrOutputParser()
    )

    return qa_chain


def ask(qa_chain, question: str):
    """질문을 받아 답변과 출처 문서를 반환합니다."""
    result = qa_chain.invoke(question)
    return result["answer"], result["context"]