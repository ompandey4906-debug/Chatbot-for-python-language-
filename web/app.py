"""Web adapter for the repository's existing Python RAG chatbot."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from langchain.chat_models import init_chat_model
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

REPO_ROOT = Path(__file__).resolve().parent.parent
WEB_ROOT = Path(__file__).resolve().parent
STATIC_ROOT = WEB_ROOT / "static"
load_dotenv(REPO_ROOT / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("python_chatbot_web")

app = FastAPI(title="Python Q&A Chatbot", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")

retriever: Any = None
chat_model: Any = None

PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful Python tutor. Answer using the provided reference context. "
            "If the context does not contain enough information, say so clearly and then "
            "offer a concise general explanation when useful. Use readable formatting and "
            "short code examples when they help.",
        ),
        ("human", "Context: {context}

Question: {question}"),
    ]
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


@app.on_event("startup")
def initialize_chatbot() -> None:
    """Load the same local vector store and model used by the CLI chatbot."""
    global retriever, chat_model

    try:
        embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vectorstore = Chroma(
            embedding_function=embedding_model,
            persist_directory=str(REPO_ROOT / "chroma_db"),
        )
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 10, "lambda_mult": 0.5},
        )
    except Exception:
        logger.exception("Could not initialize the local Python reference index")

    try:
        chat_model = init_chat_model(
            model_name="gemini-3.1-flash-lite", model_provider="google_genai"
        )
    except Exception:
        logger.exception("Could not initialize the chat model")


@app.get("/")
def home() -> FileResponse:
    return FileResponse(STATIC_ROOT / "index.html")


@app.get("/api/health")
def health() -> dict[str, bool]:
    return {"ready": retriever is not None and chat_model is not None}


@app.post("/api/chat")
def chat(request: ChatRequest) -> dict[str, Any]:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Please enter a question.")
    if retriever is None or chat_model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "The chatbot is not ready. Check the server startup logs, the root .env "
                "model credentials, and the chroma_db directory."
            ),
        )

    try:
        documents = retriever.invoke(question)
        context = "

".join(document.page_content for document in documents)
        response = chat_model.invoke(
            PROMPT.invoke({"context": context, "question": question})
        )
        answer = response.content
        if not isinstance(answer, str):
            answer = "
".join(
                str(part.get("text", "")) if isinstance(part, dict) else str(part)
                for part in answer
            )

        sources: list[str] = []
        for document in documents:
            metadata = document.metadata or {}
            source = Path(str(metadata.get("source") or "Python reference")).name
            page = metadata.get("page")
            try:
                label = f"{source} · p. {int(page) + 1}" if page is not None else source
            except (TypeError, ValueError):
                label = source
            if label not in sources:
                sources.append(label)

        return {"answer": answer, "sources": sources}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Chat request failed")
        raise HTTPException(
            status_code=502,
            detail="I couldn't get an answer right now. Check the server logs and try again.",
        ) from exc
