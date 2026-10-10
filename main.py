from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


load_dotenv()

embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vectorstore = Chroma(
    embedding_function=embedding_model,
    persist_directory="./chroma_db"
)

retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k":4,
        "fetch_k": 10,
        "lambda_mult": 0.5
        }
        )

from langchain.chat_models import init_chat_model

llm = init_chat_model(model_name="gemini-3.1-flash-lite", model_provider="google_genai")

data = PyPDFLoader("./document loaders/python.pdf")
docs = data.load()

splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )

chunks = splitter.split_documents(docs)

# prompt template
prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a smart and helpful assistant that answers questions based on the document provided to you.""",
    ),
    (
        "human",
        """Context: {context}

Question: {question}
""",
    )
])

print("HOLLY MOLLY")

print("press exit to exit the program")

while True:
    query = input("You: ")
    if query == "exit":
        break
    docs = retriever.invoke(query)

    context = "\n".join([doc.page_content for doc in docs])

    final_prompt = prompt.invoke(
        {
         "context": context,
          "question": query
          }
        )
    response = llm.invoke(final_prompt)

    print(f"Assistant: {response.content}")