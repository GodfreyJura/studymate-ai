import os

try:
    from dotenv import load_dotenv  # type: ignore[reportMissingImports]
except ImportError:
    def load_dotenv(*args, **kwargs):
        return False

from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ GEMINI_API_KEY not found in environment.")
    print("   Make sure .env exists in this folder with GEMINI_API_KEY=...")
    raise SystemExit(1)

print(f"✅ Loaded key (starts with: {api_key[:8]}...)")

client = genai.Client(api_key=api_key)

MODEL = "gemini-3.8-flash"

try:
    response = client.models.generate_content(
        model=MODEL,
        contents="Say hello to StudyMate AI in one sentence.",
    )

    text = getattr(response, "text", None)

    if not text:
        print("\n⚠️  Gemini responded, but no text was returned.")
        print("   This can happen if the response was blocked by safety filters")
        print("   or the model returned only function calls / empty candidates.")
        print(f"   Raw response: {response}")
    else:
        print("\n📨 Gemini says:")
        print(text)

except Exception as e:
    print(f"\n❌ Error calling Gemini ({MODEL}):")
    print(type(e).__name__, "-", e)