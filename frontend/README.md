# PyMentor — Python Q&A Frontend

A responsive React/Vite chat interface added as a separate frontend. The existing repository files and chatbot implementation are not edited or replaced.

## Features
- Responsive desktop and mobile layout
- Suggested Python questions and new/clear conversation controls
- Markdown rendering for explanations, tables, and code blocks
- Loading state, copy-answer action, error feedback, and optional source display
- Configurable API base URL and chat endpoint

## Run locally
Requires Node.js 18+.

    cd frontend
    npm install
    cp .env.example .env
    npm run dev

Open the Vite URL shown in your terminal (usually http://localhost:5173).

## Connect the existing backend
Set VITE_API_URL and VITE_CHAT_ENDPOINT in .env. The frontend sends a JSON POST request with question, query, and message fields. It reads answer text from answer, response, message, output, result, content, or ai_response. Optional sources/source_documents are displayed.

Important: the exact request and response schema must match your existing backend. Check its FastAPI route and request model, then adjust the frontend request body or endpoint if needed. If frontend and backend use different ports, enable CORS in the backend only if it is not already configured. Restart Vite after changing .env.

All new files live under frontend/. No original Python, RAG, vector-store, dependency, or configuration files are overwritten. Review the feature branch before merging.