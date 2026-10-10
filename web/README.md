# Python Q&A web interface

This is a separate web app for the Python RAG chatbot. It leaves the existing command-line app and all root-level files unchanged. The FastAPI adapter loads the existing Chroma index and the same Google GenAI model configuration; the browser never receives model credentials.

## Run locally

From the repository root, install the existing dependencies if needed:

~~~sh
python -m pip install -r requirements.txt
~~~

Make sure the repository's root .env has the same Google GenAI credentials used by the command-line chatbot, and that the existing chroma_db/ directory is present. Then start the web app from the repository root:

~~~sh
python -m uvicorn web.app:app --reload
~~~

Open http://127.0.0.1:8000. The first launch may take a little longer while the local embedding model is loaded. The chat endpoint uses the local vector index and sends retrieved context to the configured Google model, just like the existing chatbot flow.

The API endpoints are GET /api/health and POST /api/chat with a JSON body such as {"question":"How do Python lists work?"}. Keep .env private and do not put model credentials in the frontend.
