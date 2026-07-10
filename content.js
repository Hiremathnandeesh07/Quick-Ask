// =============================
// Quick Ask - content.js
// =============================

let widget = null;
let panel = null;
let triggerBtn = null;
let closeBtn = null;
let contentArea = null;

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// -----------------------------
// Entry Point
// -----------------------------
initialize();

// -----------------------------
// Initialize
// -----------------------------
function initialize() {
  if (document.getElementById("qa-sidebar-widget")) return;

  createWidget();
  bindEvents();
}

// -----------------------------
// Create Widget
// -----------------------------
function createWidget() {
  widget = document.createElement("div");
  widget.id = "qa-sidebar-widget";

  widget.innerHTML = `
        <button id="qa-widget-trigger" title="Explain Selected Text">
            ⚡
        </button>

        <div id="qa-widget-panel">

            <div class="qa-widget-header">
                <span>Quick Ask</span>
                <button id="qa-widget-close">&times;</button>
            </div>

            <div class="qa-widget-content">
                Select any text inside ChatGPT and click ⚡
            </div>

        </div>
    `;

  document.body.appendChild(widget);

  triggerBtn = document.getElementById("qa-widget-trigger");
  panel = document.getElementById("qa-widget-panel");
  closeBtn = document.getElementById("qa-widget-close");
  contentArea = document.querySelector(".qa-widget-content");
}

// -----------------------------
// Bind Events
// -----------------------------
function bindEvents() {
  triggerBtn.addEventListener("click", onTriggerClick);

  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });
}

// -----------------------------
// Trigger Click
// -----------------------------
async function onTriggerClick() {
  const selectedText = getSelectedText();

  panel.style.display = "block";

  if (!selectedText) {
    showMessage("Please highlight a word or sentence first.");
    return;
  }

  await fetchExplanation(selectedText);
}

// -----------------------------
// Get Selected Text
// -----------------------------
function getSelectedText() {
  return window.getSelection().toString().trim();
}

// -----------------------------
// Loading
// -----------------------------
function showLoading(text) {
  contentArea.innerHTML = `

        <div class="qa-loading">

            <div class="spinner"></div>

            <div style="margin-top:12px;">
                ${text}
            </div>

        </div>

    `;
}

// -----------------------------
// Message
// -----------------------------
function showMessage(message) {
  contentArea.innerHTML = `
        <div class="qa-message">
            ${message}
        </div>
    `;
}

// -----------------------------
// Apply Highlight.js Highlighting
// -----------------------------
function applyHighlightJs(root) {
  if (!window.hljs) return;

  const blocks = root.querySelectorAll("pre code");
  blocks.forEach((code) => {
    if (!/language-/.test(code.className)) {
      code.classList.add("language-css");
    }
    hljs.highlightElement(code);
  });
}

// -----------------------------
// Display Result
// -----------------------------
function displayResponse(html) {
  contentArea.innerHTML = html;

  applyHighlightJs(contentArea);
}

// -----------------------------
// Fetch Explanation
// -----------------------------
async function fetchExplanation(selectedText) {
  showLoading(`Explaining "<b>${selectedText}</b>"...`);

  try {
    const settings = await chrome.storage.sync.get([
      "groqApiKey",
      "model",
      "maxTokens",
    ]);

    const API_KEY = settings.groqApiKey;
    const MODEL = settings.model || "llama-3.1-8b-instant";
    const MAX_TOKENS = settings.maxTokens || 500;

    if (!API_KEY) {
      showMessage("Please save your Groq API Key from the extension popup.");

      return;
    }

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",

            content: `
You are an expert software engineering mentor.

The user is reading an LLM response and has highlighted a word, phrase, or sentence they didn't fully understand.

Your goal is to make them genuinely understand the selected text.

Rules:

1. Explain in simple English.
2. Assume the user is a software engineer.
3. Give intuition before technical details.
4. Explain why it exists.
5. Explain how it works.
6. Include a small example whenever useful.
7. If another concept is required, briefly explain it.
8. Avoid unnecessary jargon.
9. Use markdown headings.
10. Use bullet points.
11. Use code blocks if applicable.

Format:

## Meaning

...

## Why it exists

...

## How it works

...

## Example

...

## Remember

...
`,
          },

          {
            role: "user",
            content: `Explain the following selected text from an LLM response under software engineering context.

Selected Text:

"${selectedText}"

Explain it in context.`,
          },
        ],

        temperature: 0.3,

        max_tokens: MAX_TOKENS,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    const answer = data.choices[0].message.content;

    displayResponse(formatMarkdown(answer));
  } catch (error) {
    showMessage(`
            ❌ ${error.message}
        `);
  }
}

// -----------------------------
// Markdown Formatter (using marked.js)
// -----------------------------
function formatMarkdown(text) {
  // Configure marked for our use case
  marked.setOptions({
    breaks: true,
    gfm: true,
    langPrefix: "language-",
  });

  // Parse markdown to HTML
  const html = marked.parse(text);
  return html;
}
