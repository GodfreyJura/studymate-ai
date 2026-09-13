import importlib
import os

try:
    _dotenv = importlib.import_module("dotenv")
    load_dotenv = _dotenv.load_dotenv
except ImportError:  # pragma: no cover - optional dependency in some environments
    def load_dotenv(*args, **kwargs):
        return False

from google import genai

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. Add it to server/.env"
    )

_client = genai.Client(api_key=_api_key)

MODEL = "gemini-3.6-flash"


def _generate(prompt: str) -> str:
    """Single-turn generation. Returns plain text."""
    response = _client.models.generate_content(
        model=MODEL,
        contents=prompt,
    )
    return (response.text or "").strip()


def generate_insight(student_data: dict) -> str:
    """
    Build a short, personalized study insight from the student's plan.
    Returns 2-4 sentences of plain text.
    """
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
        return f"(AI unavailable: {type(e).__name__})"


def chat_reply(message: str, student_context: dict | None = None) -> str:
    """
    Multi-turn-style chat reply. Single call for now — one question, one answer.
    student_context (optional): dict with name, subjects, weak subjects, etc.
    """
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
        return f"(AI unavailable: {type(e).__name__})"


def summarize_notes(notes: str, focus: str | None = None) -> str:
    """
    Summarize study notes. focus (optional): a subject or angle.
    """
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
        return f"(AI unavailable: {type(e).__name__})"


def generate_quiz(topic: str, difficulty: str = "Medium", count: int = 5) -> str:
    """
    Generate quiz questions on a topic. Returns formatted text.
    We keep this text-based for now — a JSON quiz flow comes later.
    """
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
        return f"(AI unavailable: {type(e).__name__})"