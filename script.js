// ==========================
// DOM Elements
// ==========================
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadBtn = document.querySelector("#file-upload-btn");
const themeToggle = document.querySelector("#theme-toggle");

// ================= THEME =================
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

// ==========================
// OpenRouter Config
// ==========================
const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// ==========================
// User Data Store
// ==========================
const userData = {
    message: "",
    files: [] // uploaded files metadata
};

// ==========================
// Create Message Element
// ==========================
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// ==========================
// Format Bot Response (CODE BLOCK SUPPORT)
// ==========================
function formatBotResponse(text) {
    // Escape HTML
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Convert ```code``` to <pre><code>
    text = text.replace(
        /```(\w+)?([\s\S]*?)```/g,
        (match, lang, code) => `
            <pre class="code-block">
<code>${code.trim()}</code>
            </pre>
        `
    );

    // Line breaks
    return text.replace(/\n/g, "<br>");
}

// ==========================
// Build Prompt (Message + Files)
// ==========================
const buildUserPrompt = () => {
    let prompt = `User message:\n${userData.message}\n`;

    if (userData.files.length > 0) {
        prompt += `\nUploaded files:\n`;
        userData.files.forEach((file, i) => {
            prompt += `${i + 1}. ${file.name} (${file.type}, ${Math.round(file.size / 1024)} KB)\n`;
        });
    }

    return prompt;
};

// ==========================
// Generate Bot Response
// ==========================
const generateBotResponse = async (incomingMessageDiv) => {
    const messageText = incomingMessageDiv.querySelector(".message-text");

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
                            "You are ORBIT, a friendly AI assistant created by Thirumalakonda Sreenu. If code is requested, respond using triple backticks."
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

        const botReply = data.choices[0].message.content;
        messageText.innerHTML = formatBotResponse(botReply);

    } catch (error) {
        console.error(error);
        messageText.innerText = "❌ Error getting response";
    } finally {
        incomingMessageDiv.classList.remove("thinking");
    }
};

// ==========================
// Handle User Text Message
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
            <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
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
// Emoji Picker
// ==========================
const emojiBtn = document.querySelector("#emoji-btn");
const emojiPicker = document.querySelector("#emoji-picker");

// Toggle emoji picker
emojiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle("hidden");
});

// Insert emoji into textarea
emojiPicker.addEventListener("click", (e) => {
    if (!e.target.textContent) return;

    const emoji = e.target.textContent;
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;

    messageInput.value =
        messageInput.value.substring(0, start) +
        emoji +
        messageInput.value.substring(end);

    messageInput.focus();
    messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
});

// Close picker when clicking outside
document.addEventListener("click", () => {
    emojiPicker.classList.add("hidden");
});

// ==========================
// File Upload Handling
// ==========================
fileUploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
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
// Event Listeners
// ==========================
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleOutgoingMessage(e);
});

sendMessageButton.addEventListener("click", handleOutgoingMessage);
