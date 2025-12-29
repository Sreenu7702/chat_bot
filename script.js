// ==========================
// DOM ELEMENTS
// ==========================
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadBtn = document.querySelector("#file-upload-btn");
const themeToggle = document.querySelector("#theme-toggle");
const emojiBtn = document.querySelector("#emoji-btn");
const emojiPicker = document.querySelector("#emoji-picker");

// ==========================
// HELPERS
// ==========================
function isGithubPages() {
    return location.hostname.includes("github.io");
}

// ==========================
// THEME
// ==========================
if (themeToggle) {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        localStorage.setItem(
            "theme",
            document.body.classList.contains("dark") ? "dark" : "light"
        );
    });
}

// ==========================
// OPENROUTER CONFIG (LOCAL ONLY)
// ==========================
const OPENROUTER_API_KEY = "YOUR_OPENROUTER_KEY"; // 🔒 backend recommended
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// ==========================
// USER DATA
// ==========================
const userData = {
    message: "",
    files: []
};

// ==========================
// CREATE MESSAGE ELEMENT
// ==========================
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// ==========================
// FORMAT BOT RESPONSE (CODE BLOCKS)
// ==========================
function formatBotResponse(text) {
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
        return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
    });

    return text.replace(/\n/g, "<br>");
}

// ==========================
// BUILD PROMPT (TEXT + FILES)
// ==========================
function buildUserPrompt() {
    let prompt = userData.message;

    if (userData.files.length) {
        prompt += "\n\nUploaded files:\n";
        userData.files.forEach((f, i) => {
            prompt += `${i + 1}. ${f.name} (${Math.round(f.size / 1024)} KB)\n`;
        });
    }

    return prompt;
}

// ==========================
// GENERATE BOT RESPONSE (FINAL)
// ==========================
const generateBotResponse = async (incomingMessageDiv) => {
    const messageText = incomingMessageDiv.querySelector(".message-text");

    // ✅ DEMO MODE FOR GITHUB PAGES
    if (isGithubPages()) {
        setTimeout(() => {
            messageText.innerHTML = `
                <strong>Demo Mode 🤖</strong><br>
                AI is disabled on GitHub Pages for security reasons.
                <br><br>
                👉 Backend-powered version available.
            `;
            incomingMessageDiv.classList.remove("thinking");
        }, 700);
        return;
    }

    // 🔴 REAL API (LOCAL / BACKEND)
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://127.0.0.1:5500",
                "X-Title": "ORBIT Chatbot"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3-8b-instruct",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are ORBIT, a friendly AI assistant created by Thirumalakonda Sreenu. Format code using triple backticks."
                    },
                    {
                        role: "user",
                        content: buildUserPrompt()
                    }
                ]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message);

        messageText.innerHTML = formatBotResponse(
            data.choices[0].message.content
        );

    } catch (err) {
        console.error(err);
        messageText.innerText = "❌ Error getting response";
    } finally {
        incomingMessageDiv.classList.remove("thinking");
    }
};

// ==========================
// SEND USER MESSAGE
// ==========================
const handleOutgoingMessage = (e) => {
    e.preventDefault();

    userData.message = messageInput.value.trim();
    if (!userData.message) return;

    messageInput.value = "";

    const userMsg = createMessageElement(
        `<div class="message-text">${userData.message}</div>`,
        "user-message"
    );

    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        const botThinking = createMessageElement(
            `
            <svg class="bot-avatar" viewBox="0 0 1024 1024">
                <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1l166.9-110.6h202.8c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9z"/>
            </svg>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
            `,
            "bot-message",
            "thinking"
        );

        chatBody.appendChild(botThinking);
        chatBody.scrollTop = chatBody.scrollHeight;

        generateBotResponse(botThinking);
    }, 600);
};

// ==========================
// FILE UPLOAD
// ==========================
if (fileUploadBtn) {
    fileUploadBtn.addEventListener("click", () => fileInput.click());
}

fileInput?.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    userData.files.push({
        name: file.name,
        type: file.type,
        size: file.size
    });

    const fileMsg = createMessageElement(
        `<div class="message-text">📎 ${file.name}</div>`,
        "user-message",
        "attachment"
    );

    chatBody.appendChild(fileMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    fileInput.value = "";
});

// ==========================
// EMOJI PICKER
// ==========================
emojiBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle("hidden");
});

emojiPicker?.addEventListener("click", (e) => {
    if (!e.target.textContent) return;

    const emoji = e.target.textContent;
    messageInput.value += emoji;
    messageInput.focus();
});

document.addEventListener("click", () => {
    emojiPicker?.classList.add("hidden");
});

// ==========================
// EVENTS
// ==========================
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleOutgoingMessage(e);
});

sendMessageButton.addEventListener("click", handleOutgoingMessage);
