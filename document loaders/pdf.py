from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import TokenTextSplitter

data = PyPDFLoader("./document loaders/python.pdf")

docs = data.load()

splitter = TokenTextSplitter(
    chunk_size=10000, 
    chunk_overlap=10
    )

chunks = splitter.split_documents(docs)

print(len(chunks))