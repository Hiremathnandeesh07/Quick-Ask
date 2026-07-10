const apiKeyInput = document.getElementById("apiKey");
const modelInput = document.getElementById("model");
const maxTokensInput = document.getElementById("maxTokens");

const saveBtn = document.getElementById("saveBtn");
const status = document.getElementById("status");

loadSettings();

saveBtn.addEventListener("click", saveSettings);

function loadSettings() {
  chrome.storage.sync.get(
    ["groqApiKey", "model", "maxTokens"],

    (data) => {
      apiKeyInput.value = data.groqApiKey || "";

      modelInput.value = data.model || "llama-3.1-8b-instant";

      maxTokensInput.value = data.maxTokens || 500;
    },
  );
}

function saveSettings() {
  chrome.storage.sync.set(
    {
      groqApiKey: apiKeyInput.value.trim(),

      model: modelInput.value,

      maxTokens: Number(maxTokensInput.value),
    },
    () => {
      status.textContent = "Settings Saved ✔";

      setTimeout(() => {
        status.textContent = "";
      }, 2000);
    },
  );
}
