from dotenv import load_dotenv
from langchain_community.document_loader import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

data = PyPDFLoader("./document loaders/python.pdf")
docs = data.load()

from langchain.chat_models import init_chat_model

model = init_chat_model("gemini-3.1-flash-lite", model_provider="google_genai")

template = ChatPromptTemplate.from_messages(
    [("system","you are a smart and helping ai that answers the questions and ")]
)
response = model.invoke("hello")

print(response.content)
