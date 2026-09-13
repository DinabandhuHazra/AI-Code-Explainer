const codeBox = document.getElementById("code");
const language = document.getElementById("language");
const explainBtn = document.getElementById("explainBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const result = document.getElementById("result");
const charCount = document.getElementById("charCount");

codeBox.addEventListener("input", () => {
    charCount.textContent = `${codeBox.value.length} characters`;
});

clearBtn.addEventListener("click", () => {
    codeBox.value = "";
    charCount.textContent = "0 characters";
    result.innerHTML = `
        <div class="empty">
            <div class="brain">🧠</div>
            <h3>Your explanation will appear here</h3>
            <p>Enter some code and click "Explain Code".</p>
        </div>`;
});

explainBtn.addEventListener("click", async () => {
    const code = codeBox.value.trim();
    if (!code) {
        alert("Please enter some code first.");
        return;
    }

    result.innerHTML = `
        <div class="loading">
            <div class="brain">🤖</div>
            <h3>AI is analyzing your code...</h3>
            <p>Please wait.</p>
        </div>`;

    explainBtn.disabled = true;
    explainBtn.textContent = "Analyzing...";

    try {
        const response = await fetch("/explain", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({code, language: language.value})
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Something went wrong.");

        result.innerHTML = formatExplanation(data.explanation);
    } catch (error) {
        result.innerHTML = `
            <div class="error">
                <strong>❌ Error</strong>
                <p>${escapeHtml(error.message)}</p>
            </div>`;
    } finally {
        explainBtn.disabled = false;
        explainBtn.textContent = "🤖 Explain Code";
    }
});

copyBtn.addEventListener("click", async () => {
    const text = result.innerText.trim();
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = "Copy", 1500);
    } catch {
        alert("Could not copy the explanation.");
    }
});

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatExplanation(text) {
    // Protect code blocks before formatting the rest of the Markdown-like response.
    const blocks = [];
    let html = escapeHtml(text).replace(/```(?:[a-zA-Z0-9_+#.-]+)?\n?([\s\S]*?)```/g, (_, code) => {
        const token = `___CODE_BLOCK_${blocks.length}___`;
        blocks.push(`<pre><code>${code.trim()}</code></pre>`);
        return token;
    });

    html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\n/g, "<br>");

    blocks.forEach((block, i) => {
        html = html.replace(`___CODE_BLOCK_${i}___`, block);
    });

    return html;
}
