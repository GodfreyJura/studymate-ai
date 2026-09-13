import importlib
import os
import time
import traceback

_dotenv = None
try:
    _dotenv = importlib.import_module("dotenv")
except ImportError:
    _dotenv = None


def load_dotenv(*args, **kwargs):
    if _dotenv is not None:
        return _dotenv.load_dotenv(*args, **kwargs)
    return False


from google import genai

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. Add it to server/.env or Render env vars."
    )

_client = genai.Client(api_key=_api_key)

# Try these models in order. First one that works wins.
# Newest/best first, most stable as fallback.
MODELS = [
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]


def _generate(prompt: str) -> str:
    """Generate text with retry + model fallback."""
    last_error = None

    for model in MODELS:
        for attempt in range(2):  # 2 tries per model
            try:
                response = _client.models.generate_content(
                    model=model,
                    contents=prompt,
                )
                text = (response.text or "").strip()
                if text:
                    return text
                # Empty response — try again / next model
                print(f"[{model}] empty response, attempt {attempt + 1}")
            except Exception as e:
                last_error = e
                error_str = str(e)

                # 503 = temporary overload → retry same model
                if "503" in error_str or "UNAVAILABLE" in error_str:
                    print(f"[{model}] busy (503), retrying in 2s...")
                    time.sleep(2)
                    continue

                # 429 = rate limit → wait longer, then retry
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    print(f"[{model}] rate limited (429), waiting 5s...")
                    time.sleep(5)
                    continue

                # 404 = model not available → skip to next model
                if "404" in error_str or "NOT_FOUND" in error_str:
                    print(f"[{model}] not available, trying next model...")
                    break

                # Other error → log and move on to next model
                print(f"[{model}] error: {type(e).__name__}: {e}")

    # All models and retries exhausted
    print("=" * 60)
    print("ALL GEMINI MODELS FAILED")
    print(f"Key prefix: {_api_key[:8] if _api_key else 'MISSING'}")
    print(f"Key length: {len(_api_key) if _api_key else 0}")
    print(f"Last error: {last_error}")
    print("=" * 60)
    traceback.print_exception(
        type(last_error), last_error, last_error.__traceback__
    ) if last_error else None
    raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")


def generate_insight(student_data: dict) -> str:
    name = student_data.get("name", "the student")
    study_hours = student_data.get("study_hours", 0)
    has_deadlines = student_data.get("has_deadlines", False)
    study_load = student_data.get("study_load", "Unknown")

    plan_lines = []
    for item in student_data.get("study_plan", []):
        plan_lines.append(
            f"- {item.get('subject')}: score {item.get('score')}%, "
            f"difficulty {item.get('difficulty')}, "
            f"priority {item.get('priority')}"
        )
    plan_text = "\n".join(plan_lines) or "(no subjects)"

    prompt = f"""You are StudyMate AI, a concise study coach for students.

Student: {name}
Available study hours today: {study_hours}
Has upcoming deadlines: {"yes" if has_deadlines else "no"}
Study load: {study_load}

Subject breakdown:
{plan_text}

Write a short personalized study insight (2-4 sentences max).
Rules:
- Address the student directly ("you").
- Point out the ONE subject that needs the most attention and why.
- Give ONE concrete, actionable suggestion.
- No bullet points, no markdown, no greetings.
- Be warm but direct, like a good tutor.
"""

    try:
        text = _generate(prompt)
        return text or "Keep going — consistency beats intensity."
    except Exception as e:
        return f"(AI unavailable: {type(e).__name__}: {e})"


def chat_reply(message: str, student_context: dict | None = None) -> str:
    context_block = ""
    if student_context:
        name = student_context.get("name", "the student")
        subjects = student_context.get("subjects", [])

        if subjects:
            lines = [
                f"- {s['name']}: {s['score']}% ({s['difficulty']})"
                for s in subjects
            ]
            context_block = (
                f"\nContext — the student is {name} and is studying:\n"
                + "\n".join(lines)
                + "\nUse this context only if it's relevant. Don't restate it back to them.\n"
            )

    prompt = f"""You are StudyMate AI — a friendly, focused study tutor.

Rules:
- Be concise. 2-5 sentences usually. Longer only when a real explanation is needed.
- Speak directly to the student ("you").
- Use plain language. No markdown formatting, no bullet lists unless truly helpful.
- If asked something off-topic (not study-related), gently redirect.
- Never invent facts. If unsure, say so.
{context_block}
Student's question:
{message}
"""

    try:
        return _generate(prompt) or "I didn't catch that. Try rephrasing?"
    except Exception as e:
        return f"(AI unavailable: {type(e).__name__}: {e})"


def summarize_notes(notes: str, focus: str | None = None) -> str:
    focus_line = f"\nFocus the summary around: {focus}\n" if focus else ""

    prompt = f"""You are StudyMate AI. Summarize the following study notes for a student.
{focus_line}
Rules:
- Give a clear, structured summary a student can revise from.
- Start with a 1-sentence overview.
- Then 3-6 key points, each on its own line starting with "• ".
- End with a single "Remember:" line — the most important takeaway.
- No other formatting, no preamble.

Notes:
{notes}
"""

    try:
        return _generate(prompt) or "Couldn't summarize those notes."
    except Exception as e:
        return f"(AI unavailable: {type(e).__name__}: {e})"


def generate_quiz(topic: str, difficulty: str = "Medium", count: int = 5) -> str:
    prompt = f"""You are StudyMate AI. Generate a short quiz for a student.

Topic: {topic}
Difficulty: {difficulty}
Number of questions: {count}

Format each question exactly like this:
1. <question>
   a) <option>
   b) <option>
   c) <option>
   d) <option>
   Answer: <letter>

Rules:
- One blank line between questions.
- Make sure only ONE option is correct.
- No preamble, no extra commentary.
- If the topic is too vague to generate questions, ask one clarifying question instead.
"""

    try:
        return _generate(prompt) or "Couldn't generate a quiz."
    except Exception as e:
        return f"(AI unavailable: {type(e).__name__}: {e})"