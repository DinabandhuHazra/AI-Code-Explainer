from flask import Flask, render_template, request, jsonify
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to your .env file.")

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """
You are an expert programming teacher.

Explain programming code to beginners using very simple English.

The supported languages are Python, Java, C and C++.

Explain:
1. What does the code do?
2. How does it work?
3. Important lines and keywords
4. Example
5. Expected output
6. Time complexity
7. Space complexity
8. Possible errors or problems
9. A simple beginner summary

Use simple English and clear headings.
If there is an error, explain how to fix it.
Do not claim that code was executed unless it actually was.
"""

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/explain", methods=["POST"])
def explain_code():
    data = request.get_json(silent=True) or {}
    code = str(data.get("code", ""))
    language = str(data.get("language", "Auto Detect"))

    if not code.strip():
        return jsonify({"error": "Please enter some code."}), 400

    if len(code) > 20000:
        return jsonify({"error": "Code is too long. Please keep it under 20,000 characters."}), 400

    prompt = (
        f"Programming Language: {language}\n\n"
        "Explain this code in a beginner-friendly way:\n\n"
        f"{code}"
    )

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_completion_tokens=3000,
        )

        explanation = response.choices[0].message.content or "No explanation was returned."
        return jsonify({"explanation": explanation})

    except Exception:
        app.logger.exception("Groq API request failed")
        return jsonify({
            "error": "The AI service could not process your request. Check your API key and try again."
        }), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
