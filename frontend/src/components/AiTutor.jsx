import { useState } from "react";
import {
  sendChatMessage,
  summarizeNotes,
  generateQuiz,
} from "../api";

const TABS = [
  { id: "chat", label: "Ask AI", icon: "✦" },
  { id: "summarize", label: "Summarize", icon: "▤" },
  { id: "quiz", label: "Quiz Me", icon: "◈" },
];

function AITutor({ data }) {
  const [tab, setTab] = useState("chat");

  // Build a compact student context to send along with chat messages.
  const studentContext = data
    ? {
        name: data.name,
        subjects: (data.study_plan || []).map((s) => ({
          name: s.subject,
          score: s.score,
          difficulty: s.difficulty,
        })),
      }
    : null;

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="section-label">STUDYMATE AI</span>
          <h3>AI Tutor</h3>
        </div>
      </div>

      <div className="ai-tutor-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`ai-tutor-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "chat" && <ChatPanel studentContext={studentContext} />}
      {tab === "summarize" && <SummarizePanel />}
      {tab === "quiz" && <QuizPanel />}
    </section>
  );
}

/* ---------------- Chat ---------------- */

function ChatPanel({ studentContext }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const { reply } = await sendChatMessage(text, studentContext);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: `Error: ${err.message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tutor-panel">
      <div className="ai-tutor-chat">
        {messages.length === 0 && (
          <div className="ai-tutor-empty">
            <p>Ask anything about your subjects.</p>
            <p className="ai-tutor-hint">
              Try: "Explain recursion in simple terms" or
              "How can I improve my Cybersecurity score?"
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`ai-message ${m.role} ${m.error ? "error" : ""}`}
          >
            <span className="ai-message-role">
              {m.role === "user" ? "You" : "StudyMate AI"}
            </span>
            <p>{m.text}</p>
          </div>
        ))}

        {loading && (
          <div className="ai-message ai">
            <span className="ai-message-role">StudyMate AI</span>
            <p className="ai-typing">Thinking...</p>
          </div>
        )}
      </div>

      <form className="ai-tutor-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask a study question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="primary-button"
          disabled={loading || !message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

/* ---------------- Summarize ---------------- */

function SummarizePanel() {
  const [notes, setNotes] = useState("");
  const [focus, setFocus] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim() || loading) return;

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const result = await summarizeNotes(notes.trim(), focus.trim() || null);
      setSummary(result.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tutor-panel">
      <form className="ai-tutor-form" onSubmit={handleSubmit}>
        <label>
          <span>Paste your notes</span>
          <textarea
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste lecture notes, a textbook section, or anything you want to revise..."
          />
        </label>

        <label>
          <span>Focus (optional)</span>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. 'exam revision' or 'key definitions'"
          />
        </label>

        <button
          type="submit"
          className="primary-button"
          disabled={loading || !notes.trim()}
        >
          {loading ? "Summarizing..." : "Summarize →"}
        </button>
      </form>

      {error && <div className="ai-tutor-error">{error}</div>}

      {summary && (
        <div className="ai-tutor-output">
          <div className="ai-output-label">Summary</div>
          <pre className="ai-output-text">{summary}</pre>
        </div>
      )}
    </div>
  );
}

/* ---------------- Quiz ---------------- */

function QuizPanel() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError("");
    setQuiz("");

    try {
      const result = await generateQuiz({
        topic: topic.trim(),
        difficulty,
        count: Number(count),
      });
      setQuiz(result.quiz);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tutor-panel">
      <form className="ai-tutor-form" onSubmit={handleSubmit}>
        <label>
          <span>Topic</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. 'Python functions' or 'TCP/IP basics'"
          />
        </label>

        <div className="form-row">
          <label>
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>

          <label>
            <span>Number of questions</span>
            <input
              type="number"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          className="primary-button"
          disabled={loading || !topic.trim()}
        >
          {loading ? "Generating..." : "Generate quiz →"}
        </button>
      </form>

      {error && <div className="ai-tutor-error">{error}</div>}

      {quiz && (
        <div className="ai-tutor-output">
          <div className="ai-output-label">Your quiz</div>
          <pre className="ai-output-text">{quiz}</pre>
        </div>
      )}
    </div>
  );
}

export default AITutor;