from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

data = PyPDFLoader("./document loaders/python.pdf")
docs = data.load()

splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )

chunks = splitter.split_documents(docs)

from langchain.chat_models import init_chat_model

model = init_chat_model("gemini-3.1-flash-lite", model_provider="google_genai")

template = ChatPromptTemplate.from_messages(
    [("system",
      """
you are smart and helpful assistant that answers the
questions asked by the user on the basis of the document provided to you 
      """),
      ("human", "{question}")]
)

prompt = template.format_messages(data = docs)
response = model.invoke(prompt)

print(response.content)
