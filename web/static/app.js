const form = document.getElementById("chat-form");
const input = document.getElementById("question-input");
const sendButton = document.getElementById("send-button");
const messageList = document.getElementById("message-list");
const welcome = document.getElementById("welcome");
const newChatButton = document.getElementById("new-chat");
const connectionPill = document.getElementById("connection-pill");
const connectionLabel = document.getElementById("connection-label");
const sidebarStatusDot = document.getElementById("sidebar-status-dot");
let busy = false;

function setConnection(state, label) {
  connectionPill.dataset.state = state;
  connectionLabel.textContent = label;
  sidebarStatusDot.dataset.state = state;
}

async function checkConnection() {
  try {
    const response = await fetch("/api/health", { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (response.ok && data.ready) {
      setConnection("ready", "Assistant ready");
    } else {
      setConnection("offline", "Assistant needs setup");
    }
  } catch (_) {
    setConnection("offline", "Assistant unavailable");
  }
}

function addMessage(role, text, sources) {
  const message = document.createElement("article");
  message.className = "message " + role;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = role === "assistant" ? "Py" : "You";

  const body = document.createElement("div");
  body.className = "message-body";
  const label = document.createElement("span");
  label.className = "message-role";
  label.textContent = role === "assistant" ? "PYTHON TUTOR" : "YOU";
  body.appendChild(label);

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  if (role === "assistant") {
    bubble.classList.add("answer-content");
    renderAnswer(bubble, text);
  } else {
    bubble.textContent = text;
  }
  body.appendChild(bubble);

  if (role === "assistant" && Array.isArray(sources) && sources.length) {
    const sourceList = document.createElement("div");
    sourceList.className = "source-list";
    sources.forEach(function (source) {
      const chip = document.createElement("span");
      chip.className = "source-chip";
      chip.textContent = source;
      sourceList.appendChild(chip);
    });
    body.appendChild(sourceList);
  }

  message.appendChild(avatar);
  message.appendChild(body);
  messageList.appendChild(message);
  scrollToLatest();
  return message;
}

function renderAnswer(container, text) {
  const pieces = String(text || "").split(/```([\s\S]*?)```/g);
  pieces.forEach(function (piece, index) {
    if (!piece) return;
    if (index % 2 === 1) {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      const firstLineEnd = piece.indexOf("\n");
      const firstLine = firstLineEnd >= 0 ? piece.slice(0, firstLineEnd).trim() : "";
      const hasLanguage = firstLine && /^[a-zA-Z0-9_+#.-]{1,20}$/.test(firstLine);
      code.textContent = hasLanguage ? piece.slice(firstLineEnd + 1).trim() : piece.trim();
      pre.appendChild(code);
      container.appendChild(pre);
      return;
    }
    piece.split(/\n{2,}/).forEach(function (paragraph) {
      if (!paragraph.trim()) return;
      const p = document.createElement("p");
      p.textContent = paragraph.trim();
      container.appendChild(p);
    });
  });
}

function scrollToLatest() {
  requestAnimationFrame(function () {
    const scroller = document.querySelector(".conversation");
    scroller.scrollTop = scroller.scrollHeight;
  });
}

function setBusy(value) {
  busy = value;
  sendButton.disabled = value;
  input.disabled = value;
  sendButton.querySelector("span").textContent = value ? "Thinking" : "Send";
  sendButton.setAttribute("aria-label", value ? "Assistant is responding" : "Send question");
  document.querySelectorAll(".suggestion-card").forEach(function (button) {
    button.disabled = value;
  });
}

async function askQuestion(question) {
  const cleaned = String(question || "").trim();
  if (!cleaned || busy) return;

  welcome.hidden = true;
  addMessage("user", cleaned);
  input.value = "";
  input.style.height = "auto";
  setBusy(true);

  const waiting = document.createElement("article");
  waiting.className = "message assistant";
  waiting.setAttribute("aria-label", "Assistant is thinking");
  waiting.innerHTML = '<div class="message-avatar" aria-hidden="true">Py</div><div class="message-body"><span class="message-role">PYTHON TUTOR</span><div class="typing-indicator" aria-hidden="true"><span></span><span></span><span></span></div></div>';
  messageList.appendChild(waiting);
  scrollToLatest();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ question: cleaned })
    });
    const data = await response.json();
    waiting.remove();
    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : "The request could not be completed.";
      addMessage("assistant", detail);
    } else {
      addMessage("assistant", data.answer || "I couldn't find an answer in the reference.", data.sources);
    }
  } catch (_) {
    waiting.remove();
    addMessage("assistant", "I can't reach the chatbot server. Start it from the repository root with the command in web/README.md, then try again.");
  } finally {
    setBusy(false);
    input.focus();
    scrollToLatest();
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  askQuestion(input.value);
});

input.addEventListener("input", function () {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
});

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll(".suggestion-card").forEach(function (button) {
  button.addEventListener("click", function () {
    askQuestion(button.dataset.question);
  });
});

newChatButton.addEventListener("click", function () {
  if (busy) return;
  messageList.replaceChildren();
  welcome.hidden = false;
  input.value = "";
  input.style.height = "auto";
  input.focus();
});

checkConnection();
